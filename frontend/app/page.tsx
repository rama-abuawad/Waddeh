"use client";

import HomeComposer from "@/components/home/home-composer";
import LandingExperiment from "@/components/landing/landing-experiment";
import { useWaddeh } from "@/components/waddeh-provider";

export default function HomePage() {
  const { uiLanguage, setUiLanguage } = useWaddeh();
  return (
    <>
      <LandingExperiment uiLanguage={uiLanguage} onLanguageChange={setUiLanguage} />
      <HomeComposer />
    </>
  );
}
