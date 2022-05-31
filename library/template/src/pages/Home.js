import { Intro, IntroLink } from '/features/home/Intro'
import { Section } from '/features/home/pageOnly/Section'
import { ContainerMd } from '/features/pageOnly/Container'
import Footer from '/features/pageOnly/Footer.universal'

export function Home() {
  return (
    <Section>
      <ContainerMd>
        <Intro>
          <p>@kaliber/build</p>
          <IntroLink to='https://kaliberjs.github.io/build/' target='_blank'>Documentatie</IntroLink>
        </Intro>
      </ContainerMd>

      <Footer />
    </Section>
  )
}
