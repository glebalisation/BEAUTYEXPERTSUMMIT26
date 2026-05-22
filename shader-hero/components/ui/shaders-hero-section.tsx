"use client"

import { PulsingBorder, MeshGradient } from "@paper-design/shaders-react"
import { motion } from "framer-motion"
import type React from "react"
import { useEffect, useRef, useState } from "react"

interface ShaderBackgroundProps {
  children: React.ReactNode
}

export function ShaderBackground({ children }: ShaderBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isActive, setIsActive] = useState(false)

  useEffect(() => {
    const handleMouseEnter = () => setIsActive(true)
    const handleMouseLeave = () => setIsActive(false)

    const container = containerRef.current
    if (container) {
      container.addEventListener("mouseenter", handleMouseEnter)
      container.addEventListener("mouseleave", handleMouseLeave)
    }
    return () => {
      if (container) {
        container.removeEventListener("mouseenter", handleMouseEnter)
        container.removeEventListener("mouseleave", handleMouseLeave)
      }
    }
  }, [])

  return (
    <div ref={containerRef} className="min-h-screen w-full relative overflow-hidden">
      {/* SVG Filters */}
      <svg className="absolute inset-0 w-0 h-0">
        <defs>
          <filter id="glass-effect" x="-50%" y="-50%" width="200%" height="200%">
            <feTurbulence baseFrequency="0.005" numOctaves="1" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="0.3" />
            <feColorMatrix
              type="matrix"
              values="1 0 0 0 0.02
                      0 1 0 0 0.02
                      0 0 1 0 0.05
                      0 0 0 0.9 0"
              result="tint"
            />
          </filter>
          <filter id="gooey-filter" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9"
              result="gooey"
            />
            <feComposite in="SourceGraphic" in2="gooey" operator="atop" />
          </filter>
        </defs>
      </svg>

      {/* Background Shaders — palette: espresso navy + gold + mid-navy + steel-blue */}
      <MeshGradient
        className="absolute inset-0 w-full h-full"
        colors={["#0D1B2A", "#C9A96E", "#E8D5B0", "#1A3A5C", "#5A7A9A"]}
        speed={0.3}
      />
      <MeshGradient
        className="absolute inset-0 w-full h-full opacity-60"
        colors={["#0D1B2A", "#E8D5B0", "#C9A96E", "#1A3A5C"]}
        speed={0.2}
      />

      {children}
    </div>
  )
}

export function PulsingCircle() {
  return (
    <div className="absolute bottom-8 right-8 z-30">
      <div className="relative w-20 h-20 flex items-center justify-center">
        <PulsingBorder
          colors={["#C9A96E", "#E8D5B0", "#F5F0E8", "#5A7A9A", "#C9A96E", "#E8D5B0", "#1A3A5C"]}
          colorBack="#00000000"
          speed={1.5}
          roundness={1}
          thickness={0.1}
          softness={0.2}
          intensity={5}
          spots={5}
          spotSize={0.1}
          pulse={0.1}
          smoke={0.5}
          smokeSize={4}
          scale={0.65}
          rotation={0}
          frame={9161408.251009725}
          style={{ width: "60px", height: "60px", borderRadius: "50%" }}
        />

        <motion.svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 100 100"
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
          style={{ transform: "scale(1.6)" }}
        >
          <defs>
            <path id="circle" d="M 50, 50 m -38, 0 a 38,38 0 1,1 76,0 a 38,38 0 1,1 -76,0" />
          </defs>
          <text className="text-sm">
            <textPath href="#circle" startOffset="0%" fill="#C9A96E" fillOpacity="0.8">
              21st.dev is cool • 21st.dev is cool • 21st.dev is cool • 21st.dev is cool •
            </textPath>
          </text>
        </motion.svg>
      </div>
    </div>
  )
}

export function HeroContent() {
  return (
    <main className="absolute bottom-8 left-8 z-20 max-w-lg">
      <div className="text-left">
        <div
          className="inline-flex items-center px-3 py-1 rounded-full bg-[#C9A96E]/10 backdrop-blur-sm mb-4 relative"
          style={{ filter: "url(#glass-effect)" }}
        >
          <div className="absolute top-0 left-1 right-1 h-px bg-gradient-to-r from-transparent via-[#C9A96E]/20 to-transparent rounded-full" />
          <span className="text-[#E8D5B0]/90 text-xs font-light relative z-10">✨ New Paper Shaders Experience</span>
        </div>

        <h1 className="text-5xl md:text-6xl md:leading-16 tracking-tight font-light text-[#E8D5B0] mb-4">
          <span className="font-medium italic">Beautiful</span> Shader
          <br />
          <span className="font-light tracking-tight text-[#E8D5B0]">Experiences</span>
        </h1>

        <p className="text-xs font-light text-[#5A7A9A] mb-4 leading-relaxed">
          Create stunning visual experiences with our advanced shader technology. Interactive lighting, smooth
          animations, and beautiful effects that respond to your every move.
        </p>

        <div className="flex items-center gap-4 flex-wrap">
          <button className="px-8 py-3 rounded-full bg-transparent border border-[#C9A96E]/30 text-[#E8D5B0] font-normal text-xs transition-all duration-200 hover:bg-[#C9A96E]/10 hover:border-[#C9A96E]/50 cursor-pointer">
            Pricing
          </button>
          <button className="px-8 py-3 rounded-full bg-[#C9A96E] text-[#0D1B2A] font-normal text-xs transition-all duration-200 hover:bg-[#E8D5B0] cursor-pointer">
            Get Started
          </button>
        </div>
      </div>
    </main>
  )
}

export function Header() {
  return (
    <header className="relative z-20 flex items-center justify-between p-6">
      <div className="flex items-center">
        <svg
          width="40"
          height="40"
          viewBox="0 0 400 400"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-label="21st logo"
          className="text-[#E8D5B0]"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M358.333 0C381.345 0 400 18.6548 400 41.6667V295.833C400 298.135 398.134 300 395.833 300H270.833C268.532 300 266.667 301.865 266.667 304.167V395.833C266.667 398.134 264.801 400 262.5 400H41.6667C18.6548 400 0 381.345 0 358.333V304.72C0 301.793 1.54269 299.081 4.05273 297.575L153.76 207.747C157.159 205.708 156.02 200.679 152.376 200.065L151.628 200H4.16667C1.86548 200 6.71103e-08 198.135 0 195.833V104.167C1.07376e-06 101.865 1.86548 100 4.16667 100H162.5C164.801 100 166.667 98.1345 166.667 95.8333V4.16667C166.667 1.86548 168.532 1.00666e-07 170.833 0H358.333ZM170.833 100C168.532 100 166.667 101.865 166.667 104.167V295.833C166.667 298.135 168.532 300 170.833 300H262.5C264.801 300 266.667 298.135 266.667 295.833V104.167C266.667 101.865 264.801 100 262.5 100H170.833Z"
            fill="currentColor"
          />
        </svg>
      </div>

      <nav className="flex items-center space-x-2">
        <a href="#" className="text-[#E8D5B0]/80 hover:text-[#E8D5B0] text-xs font-light px-3 py-2 rounded-full hover:bg-[#C9A96E]/10 transition-all duration-200">
          Features
        </a>
        <a href="#" className="text-[#E8D5B0]/80 hover:text-[#E8D5B0] text-xs font-light px-3 py-2 rounded-full hover:bg-[#C9A96E]/10 transition-all duration-200">
          Pricing
        </a>
        <a href="#" className="text-[#E8D5B0]/80 hover:text-[#E8D5B0] text-xs font-light px-3 py-2 rounded-full hover:bg-[#C9A96E]/10 transition-all duration-200">
          Docs
        </a>
      </nav>

      <div id="gooey-btn" className="relative flex items-center group" style={{ filter: "url(#gooey-filter)" }}>
        <button className="absolute right-0 px-2.5 py-2 rounded-full bg-[#C9A96E] text-[#0D1B2A] font-normal text-xs transition-all duration-300 hover:bg-[#E8D5B0] cursor-pointer h-8 flex items-center justify-center -translate-x-10 group-hover:-translate-x-19 z-0">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17L17 7M17 7H7M17 7V17" />
          </svg>
        </button>
        <button className="px-6 py-2 rounded-full bg-[#C9A96E] text-[#0D1B2A] font-normal text-xs transition-all duration-300 hover:bg-[#E8D5B0] cursor-pointer h-8 flex items-center z-10">
          Login
        </button>
      </div>
    </header>
  )
}
