import React from "react";
import Header from "./Header";
import Hero from "./Hero";
import About from "./About";
import Features from "./Features";
import HowItWorks from "./HowItWorks";
import Benefits from "./Benefits";
import Contact from "./Contact";
import Footer from "./Footer";
import { ActiveSectionProvider } from "./ActiveSection";

const LandingPage: React.FC = () => {
  return (
    <ActiveSectionProvider>
      <div className="w-full min-h-screen flex flex-col bg-[#f5f7f9]">
        <Header />
        <main className="flex flex-col">
          <section id="home">
            <Hero />
          </section>
          <section id="about">
            <About />
          </section>
          <section id="features">
            <Features />
          </section>
          <section id="how-it-works">
            <HowItWorks />
          </section>
          <section id="benefits">
            <Benefits />
          </section>
          <section id="contact">
            <Contact />
          </section>
        </main>
        <Footer />
      </div>
    </ActiveSectionProvider>
  );
};

export default LandingPage;
