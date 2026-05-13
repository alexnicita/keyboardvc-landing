import { useEffect } from "react"
import { ArrowRight, Pause, Play } from "lucide-react"

import { Button } from "@/components/ui/button"

function App() {
  useEffect(() => {
    void import("@/experience")
  }, [])

  return (
    <div className="page-shell" data-view="music" data-loading="true">
      <header className="intro site-header" aria-label="Keyboard VC header">
        <a className="brand-lockup" href="/" aria-label="Keyboard VC">
          <span className="brand-copy">
            <em>
              <strong className="intro-title" data-title="Keyboard VC" />
            </em>
            <span className="brand-line">frontier technology investments</span>
          </span>
        </a>
      </header>

      <main className="experience-stage">
        <section
          className="music-view"
          aria-label="Moonlight Sonata third movement score art"
        >
          <div className="score-circle" aria-hidden="true">
            <div id="long-score" className="long-score" />
          </div>
        </section>

        <section className="portfolio-view" aria-hidden="true">
          <ul id="portfolio-list" className="portfolio-list" />
        </section>

        <div className="control-dock" aria-label="Experience controls">
          <Button
            id="play-button"
            aria-label="Play"
            className="play-button control-button"
            type="button"
            size="lg"
          >
            <Play className="play-control-icon play-control-icon-play" aria-hidden="true" />
            <Pause className="play-control-icon play-control-icon-pause" aria-hidden="true" />
            <span className="sr-only" data-play-label>Play</span>
          </Button>
          <footer className="site-footer">
            <div className="copyright">© 2026</div>
            <a className="footer-link" href="mailto:contact@keyboard.vc">
              Contact
            </a>
          </footer>
          <Button
            id="portfolio-button"
            className="portfolio-button control-button"
            type="button"
            size="lg"
            variant="outline"
          >
            <span className="sr-only">Show</span>
            <span data-portfolio-label>Portfolio</span>
            <ArrowRight data-icon="inline-end" aria-hidden="true" />
          </Button>
        </div>
      </main>
    </div>
  )
}

export default App
