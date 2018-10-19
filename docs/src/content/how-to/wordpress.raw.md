## Wordpress

The world is full of Wordpress sites and sometimes you want to do more engaging things where a
modern front-end stack (and especially React) would help tremendously. This library can be used
with Wordpress and still provide most of the features offered by this library (most uniquely hot
reloading).

This page is added to to the documentation to show how you could use this library with a non node.js
framework. As a consequence there is no server side rendering using React. So this effectively means
you only use it to add single page applications or dynamic (javascript) components.

The code listings here are suggestions and meant to give you a concrete idea of the direction.

{toc}

### Step 1 - directories

The directory structure should look something like this:

```js
|_ config/
|_ src/
|_ target/
|   |_ kaliberjs/
|_ www/
|   |_ kaliberjs/
|_ package.json
```

As you can see this is the default directory structure as defined by the conventions of this library
with one addition: the `www/` directory which is the root of your Wordpress site.

`www/kaliberjs/` should be defined as a symlink to `../target/kaliberjs`

### Step 2 - public path

In the previous step we have set up the directory structure in way that allows us to keep the source
files out of the root and supply a route from the web root to the compiled files (`/kaliberjs/`).
Now we need to make sure our compiled assets end up in the correct directory and function correctly
in that sub directory.

We do this by adding a public path to the configuration:

`config/default.js`
```js
module.exports = {
  kaliber: {
    publicPath: '/kaliberjs/'
  }
}
```

### Step 3 - rendering to php

In order to supply a nice and clear gateway to php we define a custom template renderer that handles
`*.php.js` files. It would need to perform the following tasks:

- Clone the given template to add `phpProps="%PHP_PROPS%"` as a prop
- Render the cloned template to a string
- Generate PHP code that
  - renders all required for the component
  - replaces `%PHP_PROPS%` with a JSON encoded value from PHP
  - outputs the result

This is a practical example:

`src/php-renderer.js`
```js
/* global __webpack_chunkname__ */
const ReactDOMServer = require('react-dom/server')
const React = require('react')

const PHP_PROPS = '%PHP_PROPS%'

module.exports = function phpReactRenderer(template) {
  if (!template) return template

  const templateWithPhpProps = React.cloneElement(template, { phpProps: PHP_PROPS })

  return `
  <?php
    kaliber_renderEntry('${__webpack_chunkname__}');
    // nowdoc syntax requires the closing 'tag' is at the very beginning of it's own line.
    $template = <<<'KALIBERJS_REACT_TEMPLATE'
      ${ReactDOMServer.renderToStaticMarkup(templateWithPhpProps)}
KALIBERJS_REACT_TEMPLATE;
    $props = htmlspecialchars(json_encode($this->args), ENT_QUOTES, 'UTF-8');
    echo str_replace("&quot;${PHP_PROPS}&quot;", $props, $template);
  ?>
  `
}
```

We also need to register the php template renderer:

`config/default.js`
```js
module.exports = {
  kaliber: {
    templateRenderers: {
      php: '/php-renderer'
    }
  }
}
```

### Step 4 - styles and scripts

In order to be able to render all output of this library you need to create some php code. This php
code should supply you with a function that receives the name of an entry and renders all related
script and style tags.

This is done by making use of the 3 manifests this library spits out:

- `target/chunk-manifest.json`
- `target/css-manifest.json`
- `target/entry-manifest.json`

This is what we use:

```php
<?php
if (!isset($kaliber_renderedScripts)) $kaliber_renderedScripts = [];
if (!isset($kaliber_renderedStyles)) $kaliber_renderedStyles = [];
if (!function_exists('kaliber_renderScript')) {
  function kaliber_renderScript ($scriptName) {
    global $kaliber_renderedScripts;
    if (!in_array($scriptName, $kaliber_renderedScripts)) {
      array_push($kaliber_renderedScripts, $scriptName);
      // https://www.w3.org/TR/html4/intro/sgmltut.html#h-3.2.2
      echo "<script defer src='/kaliberjs/{$scriptName}'></script>";
    }
  }
}
if (!function_exists('kaliber_renderStyle')) {
  function kaliber_renderStyle ($styleName) {
    global $kaliber_renderedStyles;
    if (!in_array($styleName, $kaliber_renderedStyles)) {
      array_push($kaliber_renderedStyles, $styleName);
      // https://www.w3.org/TR/html4/intro/sgmltut.html#h-3.2.2
      echo "<link rel='stylesheet' href='/kaliberjs/{$styleName}' type='text/css' media='all' />";
    }
  }
}
if (!function_exists('kaliber_renderEntry')) {
  function kaliber_renderEntry ($entryName) {
    $dir_kaliberjs = $_SERVER['DOCUMENT_ROOT'] . '/kaliberjs';
    $chunkManifest = json_decode(file_get_contents($dir_kaliberjs . '/chunk-manifest.json'), true);
    $cssManifest = json_decode(file_get_contents($dir_kaliberjs . '/css-manifest.json'), true);
    $entryManifest = json_decode(file_get_contents($dir_kaliberjs . '/entry-manifest.json'), true);
    $entryChunks = array_key_exists($entryName, $entryManifest) ? $entryManifest[$entryName] : [$entryName];
    foreach ($entryChunks as $x) {
      if (array_key_exists($x, $chunkManifest)) {
        $chunk = $chunkManifest[$x];
        foreach ($chunk['group'] as $y) kaliber_renderScript($chunkManifest[$y]['filename']);
        kaliber_renderScript($chunk['filename']);
      }
    }
    $cssFiles = array_key_exists($entryName, $cssManifest) ? $cssManifest[$entryName] : [];
    foreach ($cssFiles as $x) {
      kaliber_renderStyle($x);
    }
  }
}
```

For our global CSS and global javascript we use the following code:

```php
<?php
  kaliber_renderEntry('main.entry.js');
  kaliber_renderEntry('main.entry.css');
  wp_head();
?>
```

### Step 5 - using the component

First you need to create your php component:

`src/app.php.js`
```jsx
import config from '@kaliber/config'
import App from '/App?universal'

export default <App config={config.client} />
```

In order to use it you need to include the generated php template, we use the following helper code:

```php
if ( ! class_exists('kaliber_Component') ) {
  class kaliber_Component {
    private $args;
    private $file;
    public function __construct($file, $args = array()) {
      $this->file = $file;
      $this->args = $args;
    }
    public function render() {
      $file = $_SERVER['DOCUMENT_ROOT'] . $this->file;
      if (file_exists($file)) {
        include($file);
      } else {
        throw new Exception($this->file . ' not found');
      }
    }
  }
}

if( !function_exists('kaliber_render_component') ) {
  function kaliber_render_component($file, $args = array()) {
    $fileWithExtension = preg_replace('/\.php$/i', '', $file) . '.php';
    $template = new kaliber_Component('/kaliberjs/' . $fileWithExtension, $args);
    $template->render();
  }
}
```

And, finally, to use the component:

```php
kaliber_render_component('app', [ 'message' => 'from PHP' ])
```

The `message` is accessible in the application at `this.props.phpProps.message`.
