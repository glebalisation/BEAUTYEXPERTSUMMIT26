"use client"

import { Header, HeroContent, PulsingCircle, ShaderBackground } from "@/components/ui/shaders-hero-section"

export default function ShaderShowcase() {
  return (
    <ShaderBackground>
      <Header />
      <HeroContent />
      <PulsingCircle />
    </ShaderBackground>
  )
}
