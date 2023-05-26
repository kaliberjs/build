import { Intro, IntroLink } from '/components/home/Intro'
import { Section } from '/components/home/pageOnly/Section'
import { ContentContainer } from '/components/home/pageOnly/ContentContainer'

export function Home() {
  return (
    <Section>
      <ContentContainer size='md'>
        <Intro>
          <p>@kaliber/build</p>
          <IntroLink to='https://kaliberjs.github.io/build/' target='_blank'>Documentatie</IntroLink>
        </Intro>
      </ContentContainer>
    </Section>
  )
}
