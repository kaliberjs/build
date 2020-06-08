import { Intro, IntroLink } from '/home/Intro'
import { Section } from '/home/pageOnly/Section'
import { ContentContainer } from '/home/pageOnly/ContentContainer'

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
