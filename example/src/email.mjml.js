import logo from '/eecolor.png'
import { assetURL } from '@kaliber/config'

export default (
  <mjml>
    <mj-head>
      <mj-style inline='inline' dangerouslySetInnerHTML={{ __html: `
        .box-shadow { box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.20); }
      ` }} />
    </mj-head>
    <mj-body>
      <mj-container background-color='#F3F3F3'>

        <mj-section padding-left='20' padding-right='20'>
          <mj-column>
            { /* using the construction below is dangerous as logo might be inlined */}
            <mj-image width='180' src={assetURL + logo} />
            <mj-spacer height='20' />
          </mj-column>
        </mj-section>

        <mj-section padding-left='20' padding-right='20'>
          <mj-column>
            <mj-text align='center' font-size='20px' color='#FFFFFF' font-family='Nunito'>Text</mj-text>
          </mj-column>
        </mj-section>

        <mj-wrapper css-class='box-shadow' padding='0' background-color='#FCFCFC'>
          <mj-raw>{'{{~it.tests :test}}'}</mj-raw>
          <mj-section border-bottom='1px solid #F3F3F3' padding-left='20' padding-right='20'>
            <mj-column>
              <mj-text>{'{{=test.name}}'}</mj-text>
            </mj-column>
          </mj-section>
          <mj-raw>{'{{~}}'}</mj-raw>
        </mj-wrapper>

        <mj-section>
          <mj-column width='100%'>
            <mj-button href="http://test.com" background-color='#6D88A1'>Click me</mj-button>
          </mj-column>
        </mj-section>

        <mj-section>
          <mj-column width='75%'>
            <mj-text align='center' font-size='10' line-height='1.5' font-family='Lato, Helvetica, Arial' color='#929199'>
              You want this mail.<br />
              <a href="http://test.com" style={{ color: '#929199' }}>footer</a>
            </mj-text>
          </mj-column>
        </mj-section>

      </mj-container>
    </mj-body>
  </mjml>
)