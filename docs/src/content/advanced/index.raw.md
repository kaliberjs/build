## Advanced

Within the various webpack plugins and loaders as well as the provided library files we use some
advanced techniques. It's is generally not a smart idea to use these techniques, but sometimes it's
the only way to go.

{toc}

### Variables

Webpack plugins are allowed to add special variables. This section contains a list of these
variables. Note that these might change between versions.

It is very rare to see these in ordinary modules. They are most common in webpack loaders and, for
this particular library, in template renderers.

| Variable                             | Source                         | Description                                                     |
| :--------                            | :------                        | :-----------                                                    |
| \_\_webpack_css_chunk_hashes\_\_     | merge-css-plugin               | An array with the hashes of the CSS files for the current chunk |
| \_\_webpack_js_chunk_information\_\_ | react-universal-plugin         | An object with information about the JavaScript chunks          |
| \_\_webpack_websocket_port\_\_       | websocket-communication-plugin | The port number at which the webpack build will communicate     |
| \_\_webpack_chunk_name\_\_           | ExtendedAPIPlugin              | The name of the current chunk                                   |
| \_\_webpack_hash\_\_                 | HotModuleReplacementPlugin or ExtendedAPIPlugin | Hash of the compilation                        |
| \_\_webpack_public_path\_\_          | Webpack                        | The publicPath setting, in most applications it's better to grab it from the configuration to make your code more portable |
