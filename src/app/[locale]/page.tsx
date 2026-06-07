'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'

const features = [
  {
    name: 'Gestionarea Pacienților',
    description: 'Fișe complete ale pacienților cu istoric medical, planuri de tratament și urmărire a progresului.',
    icon: '👥',
  },
  {
    name: 'Programarea Consultațiilor',
    description: 'Sistem inteligent de programare cu memento-uri automate și integrare cu calendarul.',
    icon: '📅',
  },
  {
    name: 'Imagini Medicale',
    description: 'Instrumente avansate de imagistică cu gestionarea fotografiilor înainte/după și stocare securizată.',
    icon: '📸',
  },
  {
    name: 'Planificarea Tratamentului',
    description: 'Planificare digitală a tratamentului cu urmărire a progresului și analiză a rezultatelor.',
    icon: '📋',
  },
  {
    name: 'Sarcini',
    description: 'Sarcini cu urmărire a priorității și statusului, pentru întreaga echipă.',
    icon: '✅',
  },
  {
    name: 'Apeluri Telefonice',
    description: 'Apeluri telefonice cu funcționalitate de înregistrare și transcriere.',
    icon: '📞',
  },
  {
    name: 'Chat',
    description: 'Chat cu membrii echipei.',
    icon: '💬',
  },
  {
    name: 'Ghid Farmaceutic',
    description: 'Ghid farmaceutic cu informații despre medicamente și interacțiuni.',
    icon: '💊',
  },
  {
    name: 'Finanțe',
    description: 'Finanțe cu urmărire a veniturilor și cheltuielilor.',
    icon: '💰',
  },
  {
    name: 'Comenzi',
    description: 'Comenzi cu funcționalitate de urmărire și îndeplinire.',
    icon: '📦',
  },
  {
    name: 'Instrucțiuni',
    description: 'Instrucțiuni cu ghidare pas cu pas.',
    icon: '📖',
  },
  {
    name: 'Funcții AI',
    description: 'Funcții AI cu analiză de imagini, transcriere și multe altele.',
    icon: '🤖',
  },
]

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-blue-50">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-gray-200">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex-shrink-0">
              <h1 className="text-2xl font-bold text-red-500">Arca Life</h1>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-center space-x-4">
                <Link href="/login" className="text-gray-600 hover:text-red-500 px-3 py-2 rounded-md text-sm font-medium">
                  Autentificare
                </Link>
                <Link href="/register" className="bg-red-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-600">
                  Începeți
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="pt-24 pb-16 sm:pt-32 sm:pb-24">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl"
            >
              <span className="block">Clinica de Chirurgie Estetica</span>
              <span className="block text-red-500">Sistem de Management</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl"
            >
              Simplificați-vă clinica de chirurgie estetică cu soluția noastră all-in-one. Gestionați pacienții, procedurile chirurgicale, programările și fotografiile înainte/după într-un singur loc.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8"
            >
              <div className="rounded-md shadow">
                <Link href="/register" className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-red-500 hover:bg-red-600 md:py-4 md:text-lg md:px-10">
                  Începeți
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-12 bg-white">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-red-500 font-semibold tracking-wide uppercase">Funcționalități</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Tot ce aveți nevoie pentru a gestiona clinica dvs. de chirurgie estetică
            </p>
          </div>

          <div className="mt-10">
            <div className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10">
              {features.map((feature) => (
                <motion.div
                  key={feature.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="relative"
                >
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-red-500 text-white">
                    {feature.icon}
                  </div>
                  <p className="ml-16 text-lg leading-6 font-medium text-gray-900">{feature.name}</p>
                  <p className="mt-2 ml-16 text-base text-gray-500">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
} 