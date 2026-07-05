import { useState, useEffect } from "react"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"

// --- Subpage Components ---
function ProductSubpage({ openAuth }: { openAuth: (mode: "signin" | "signup") => void }) {
  return (
    <div style={{ zIndex: 2, position: 'relative', maxWidth: '1480px', margin: '0 auto', padding: '40px 56px 120px 56px', color: '#1A1B1F' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center', marginBottom: '60px' }}>
        <h1 style={{ fontSize: '52px', fontWeight: 800, letterSpacing: '-1.5px', marginBottom: '24px', lineHeight: 1.15 }}>
          The Next Generation of <span style={{ color: '#F42B03' }}>Safe Meetings.</span>
        </h1>
        <p style={{ fontSize: '20px', lineHeight: 1.6, color: '#55575E' }}>
          MeetFlow is built from the ground up for high-fidelity communication, absolute client-side privacy, and effortless collaborative team productivity.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '60px', alignItems: 'center', marginBottom: '80px' }}>
        <div>
          <h2 style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.8px', marginBottom: '20px', color: '#17181C' }}>Client-Side End-to-End Encryption</h2>
          <p style={{ fontSize: '17px', lineHeight: 1.65, color: '#55575E', marginBottom: '24px' }}>
            Unlike standard video systems where the server decrypts your data in the cloud, MeetFlow derives cryptographic keys directly in your browser. All audio, video, text chat, and files are encrypted before sending and decrypted only by other room participants. 
          </p>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', color: '#E52B03', fontWeight: 700, fontSize: '15px' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            <span>AES-256-GCM Military Grade Protocol</span>
          </div>
        </div>
        
        <div style={{ background: '#121316', border: '1px solid #2A2C30', borderRadius: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.18)', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 18px', background: '#1A1C20', borderBottom: '1px solid #25272C' }}>
            <div style={{ width: '11px', height: '11px', borderRadius: '50%', background: '#FF5F56' }}></div>
            <div style={{ width: '11px', height: '11px', borderRadius: '50%', background: '#FFBD2E' }}></div>
            <div style={{ width: '11px', height: '11px', borderRadius: '50%', background: '#27C93F' }}></div>
            <div style={{ flex: 1, textAlign: 'center', color: '#9A9CA3', fontSize: '12px', fontFamily: 'monospace', fontWeight: 600 }}>sh - secure-keys</div>
          </div>
          <div style={{ padding: '24px 28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#10b981', fontSize: '12px', fontWeight: 800, letterSpacing: '1px', marginBottom: '16px' }}>
              <span className="pulse-live-dot" style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></span>
              SECURE HANDSHAKE ACTIVE
            </div>
            <p style={{ fontFamily: 'monospace', fontSize: '13.5px', color: '#B3B5BD', lineHeight: 1.6, margin: 0 }}>
              <span style={{ color: '#E52B03' }}>$</span> init-session --room "team-sync-meeting"<br />
              <span style={{ color: '#FF9A3D' }}>[INFO]</span> Initializing WebRTC Peer Connection...<br />
              <span style={{ color: '#FF9A3D' }}>[KEYS]</span> Deriving key from Room ID...<br />
              <span style={{ color: '#FF9A3D' }}>[KEYS]</span> PBKDF2 salt generated. Iterations: 100,000<br />
              <span style={{ color: '#10b981' }}>[SUCCESS]</span> AES-GCM 256-bit session key derived on client.<br />
              <span style={{ color: '#10b981' }}>[SUCCESS]</span> E2EE active. Cloud tunnel: zero-knowledge.
            </p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '60px', alignItems: 'center' }}>
        <div style={{ order: 2 }}>
          <h2 style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.8px', marginBottom: '20px', color: '#17181C' }}>Collaborative Whiteboards & Chat</h2>
          <p style={{ fontSize: '17px', lineHeight: 1.65, color: '#55575E', marginBottom: '24px' }}>
            Brainstorm ideas in real-time. Our shared canvas lets you draw, write, and map workflows instantly. Pair it with encrypted chat messaging and fast binary file transfers to share mockups, spreadsheets, and assets securely.
          </p>
          <button onClick={() => openAuth("signup")} style={{ background: 'linear-gradient(150deg, #FF4A16, #E52603)', border: 'none', color: '#ffffff', fontSize: '16px', fontWeight: 700, padding: '14px 26px', borderRadius: '11px', cursor: 'pointer', boxShadow: '0 6px 16px rgba(229,38,3,0.25)' }} className="btn-hover-glow">Try Collaborative Board</button>
        </div>
        
        <div style={{ order: 1, background: '#ffffff', border: '1px solid #E8E2DC', borderRadius: '20px', padding: '16px', boxShadow: '0 20px 45px rgba(23,24,28,0.06)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #F0EAE4', paddingBottom: '10px' }}>
            <div style={{ display: 'flex', gap: '6px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#E8E2DC' }}></div>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#E8E2DC' }}></div>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#E8E2DC' }}></div>
            </div>
            <div style={{ display: 'flex', gap: '8px', background: '#F8F6F4', padding: '4px 10px', borderRadius: '8px', border: '1px solid #EAE4DE' }}>
              <div style={{ color: '#F42B03', display: 'flex', alignItems: 'center' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
              </div>
              <div style={{ color: '#55575E', display: 'flex', alignItems: 'center' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
              </div>
              <div style={{ color: '#55575E', display: 'flex', alignItems: 'center' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/></svg>
              </div>
              <div style={{ width: '1px', height: '14px', background: '#E8E2DC' }}></div>
              <div style={{ color: '#55575E', display: 'flex', alignItems: 'center' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m7 21 0-4 4-4 4 4 0 4Z"/><path d="M7 17 21 3"/></svg>
              </div>
            </div>
          </div>
          <div style={{ width: '100%', height: '160px', background: '#FAF8F6', borderRadius: '12px', border: '1px dashed #EAE4DE', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            <svg className="whiteboard-float-art" width="120" height="120" viewBox="0 0 100 100">
              <circle cx="30" cy="40" r="18" fill="none" stroke="#FF5A1F" strokeWidth="3" />
              <rect x="52" y="28" width="28" height="28" rx="5" fill="none" stroke="#F42B03" strokeWidth="3" />
              <path d="M12,78 Q50,34 88,78" fill="none" stroke="#FF9A3D" strokeWidth="4" strokeLinecap="round" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}

function FeaturesSubpage({ openAuth }: { openAuth: (mode: "signin" | "signup") => void }) {
  const fList = [
    { title: 'Screen Sharing', desc: 'Broadcast your desktop screen or window with ultra-low latency WebRTC channels.', icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/></svg>
    )},
    { title: 'Interactive Canvas', desc: 'Sketches, notes, flowcharts — draw together with team members on a live shared whiteboard.', icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
    )},
    { title: 'AES-256 Encryption', desc: 'Secure E2EE chat messaging and files using direct client-side cryptographic hashing.', icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
    )},
    { title: 'HD Audio & Video', desc: 'Crystal-clear sound and sharp high-definition peer connection profiles.', icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="13" height="12" rx="3"/><path d="m16 10.5 5-3v9l-5-3v-3Z"/></svg>
    )},
    { title: 'Session Tracker', desc: 'Accurate dynamic session timers to log duration and keep meetings on track.', icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
    )},
    { title: 'Access tokens', desc: 'Encrypted room URLs. Nobody can join your room without the secret cryptographic path token.', icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6"/><path d="m15.5 7.5 3 3h3v-2h-3v-1Z"/></svg>
    )}
  ]

  return (
    <div style={{ zIndex: 2, position: 'relative', maxWidth: '1480px', margin: '0 auto', padding: '40px 56px 120px 56px', color: '#1A1B1F' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center', marginBottom: '60px' }}>
        <h1 style={{ fontSize: '52px', fontWeight: 800, letterSpacing: '-1.5px', marginBottom: '24px', lineHeight: 1.15 }}>
          Built for Modern <span style={{ color: '#F42B03' }}>Collaborative Teams</span>
        </h1>
        <p style={{ fontSize: '20px', lineHeight: 1.6, color: '#55575E' }}>
          MeetFlow features are fine-tuned to deliver seamless video, rich interactivity, and complete data sovereignty.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '30px', marginBottom: '60px' }}>
        {fList.map((item) => (
          <div key={item.title} className="pricing-card-wrap" style={{ background: '#ffffff', border: '1px solid #E8E2DC', borderRadius: '20px', padding: '32px', boxShadow: '0 10px 25px rgba(23,24,28,0.03)', display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#F6E9E3', color: '#E52B03', display: 'flex', alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-start' }}>
              {item.icon}
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#1A1B1F', margin: 0 }}>{item.title}</h3>
            <p style={{ fontSize: '15px', lineHeight: 1.6, color: '#55575E', margin: 0 }}>{item.desc}</p>
          </div>
        ))}
      </div>

      <div style={{ textAlign: 'center' }}>
        <button onClick={() => openAuth("signup")} className="btn-hover-glow" style={{ border: 'none', background: 'linear-gradient(150deg, #FF4A16, #E52603)', color: '#ffffff', fontSize: '17px', fontWeight: 700, padding: '16px 32px', borderRadius: '12px', cursor: 'pointer', boxShadow: '0 8px 20px rgba(229,38,3,0.25)' }}>
          Start Using MeetFlow Free
        </button>
      </div>
    </div>
  )
}

function PricingSubpage({ openAuth }: { openAuth: (mode: "signin" | "signup") => void }) {
  const plans = [
    {
      name: 'Free Plan',
      price: '$0',
      period: 'forever',
      desc: 'Perfect for quick peer-to-peer check-ins and basic drawing.',
      features: [
        'Up to 10 participants per room',
        '40-minute limit on meetings',
        'Interactive shared Whiteboard',
        'Direct encrypted text Chat',
        'Standard WebRTC video profiles'
      ],
      cta: 'Get Started Free',
      popular: false,
      onClick: () => openAuth('signup')
    },
    {
      name: 'Pro Plan',
      price: '$15',
      period: 'per month',
      desc: 'Complete security and screen tools for fast-growing teams.',
      features: [
        'Up to 100 participants per room',
        'Unlimited meeting duration',
        'AES-256 E2EE file transfers',
        'HD high-quality video & audio',
        'Whiteboard + canvas asset exports',
        'Priority email support'
      ],
      cta: 'Upgrade to Pro',
      popular: true,
      onClick: () => openAuth('signup')
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: 'billing',
      desc: 'Dedicated E2EE compliance and hosting control for large setups.',
      features: [
        'Unlimited room participants',
        'On-premises / custom cloud hosting',
        'Dedicated encryption key storage',
        'Custom subdomain & branding',
        '24/7 Phone support & SLA',
        'Advanced audit logs & metrics'
      ],
      cta: 'Contact Sales',
      popular: false,
      onClick: () => openAuth('signin')
    }
  ]

  return (
    <div style={{ zIndex: 2, position: 'relative', maxWidth: '1480px', margin: '0 auto', padding: '40px 56px 120px 56px', color: '#1A1B1F' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center', marginBottom: '60px' }}>
        <h1 style={{ fontSize: '52px', fontWeight: 800, letterSpacing: '-1.5px', marginBottom: '24px', lineHeight: 1.15 }}>
          Transparent, <span style={{ color: '#F42B03' }}>Value-based Pricing</span>
        </h1>
        <p style={{ fontSize: '20px', lineHeight: 1.6, color: '#55575E' }}>
          Choose a plan that scales with your security and collaboration requirements. No hidden fees.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '30px', alignItems: 'stretch' }}>
        {plans.map((p) => (
          <div key={p.name} className="pricing-card-wrap" style={{ background: '#ffffff', border: p.popular ? '2.5px solid #FF5A1F' : '1px solid #E8E2DC', borderRadius: '24px', padding: '40px 32px', boxShadow: p.popular ? '0 20px 40px rgba(244,43,3,0.08)' : '0 15px 35px rgba(23,24,28,0.04)', display: 'flex', flexDirection: 'column', position: 'relative' }}>
            {p.popular && (
              <span style={{ position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(150deg, #FF4A16, #E52603)', color: '#ffffff', fontSize: '12px', fontWeight: 800, padding: '5px 14px', borderRadius: '999px', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
                Most Popular
              </span>
            )}
            <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#1A1B1F', margin: '0 0 10px 0' }}>{p.name}</h3>
            <p style={{ fontSize: '14px', lineHeight: 1.5, color: '#55575E', margin: '0 0 24px 0', minHeight: '44px' }}>{p.desc}</p>
            
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '28px' }}>
              <span style={{ fontSize: '46px', fontWeight: 800, color: '#1A1B1F', letterSpacing: '-1px' }}>{p.price}</span>
              <span style={{ fontSize: '15px', color: '#8c8e96', fontWeight: 600 }}>/ {p.period}</span>
            </div>

            <button 
              onClick={p.onClick} 
              className={p.popular ? "btn-hover-glow" : "btn-hover-white"}
              style={{
                width: '100%',
                border: p.popular ? 'none' : '1px solid #d8d2cc',
                background: p.popular ? 'linear-gradient(150deg, #FF4A16, #E52603)' : '#ffffff',
                color: p.popular ? '#ffffff' : '#1A1B1F',
                fontSize: '16px',
                fontWeight: 700,
                padding: '14px 20px',
                borderRadius: '12px',
                cursor: 'pointer',
                boxShadow: p.popular ? '0 6px 16px rgba(229,38,3,0.25)' : 'none',
                transition: 'all 0.2s',
                marginBottom: '32px'
              }}
            >
              {p.cta}
            </button>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {p.features.map((feat) => (
                <div key={feat} style={{ display: 'flex', gap: '10px', alignItems: 'center', fontSize: '14px', color: '#26272B', fontWeight: 500 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E52B03" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ResourcesSubpage() {
  const docs = [
    { title: 'Security Whitepaper', desc: 'Read the comprehensive details about our client-side WebRTC signal structures and key storage.', linkText: 'Download PDF' },
    { title: 'Developer API Guides', desc: 'Learn how to generate secure room links and initiate audio channels directly from your software.', linkText: 'View Reference' },
    { title: 'Frequently Asked Questions', desc: 'Quick solutions for browser video permissions, firewall setups, and client-side speeds.', linkText: 'Read FAQ' },
    { title: 'Best Practices Manual', desc: 'Learn how remote teams utilize whiteboards to improve collaboration cycles and project delivery.', linkText: 'Read Manual' }
  ]

  return (
    <div style={{ zIndex: 2, position: 'relative', maxWidth: '1480px', margin: '0 auto', padding: '40px 56px 120px 56px', color: '#1A1B1F' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center', marginBottom: '60px' }}>
        <h1 style={{ fontSize: '52px', fontWeight: 800, letterSpacing: '-1.5px', marginBottom: '24px', lineHeight: 1.15 }}>
          MeetFlow <span style={{ color: '#F42B03' }}>Resources Center</span>
        </h1>
        <p style={{ fontSize: '20px', lineHeight: 1.6, color: '#55575E' }}>
          Explore guides, security analyses, code structures, and FAQs to get the most out of your channels.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        {docs.map((d) => (
          <div key={d.title} className="pricing-card-wrap" style={{ background: '#ffffff', border: '1px solid #E8E2DC', borderRadius: '20px', padding: '36px', boxShadow: '0 10px 25px rgba(23,24,28,0.02)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#1A1B1F', margin: 0 }}>{d.title}</h3>
            <p style={{ fontSize: '15px', lineHeight: 1.6, color: '#55575E', margin: '0 0 8px 0' }}>{d.desc}</p>
            <a href="#" style={{ color: '#E52B03', fontSize: '15px', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
              {d.linkText}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </a>
          </div>
        ))}
      </div>
    </div>
  )
}

function AboutSubpage() {
  return (
    <div style={{ zIndex: 2, position: 'relative', maxWidth: '1480px', margin: '0 auto', padding: '40px 56px 120px 56px', color: '#1A1B1F' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center', marginBottom: '60px' }}>
        <h1 style={{ fontSize: '52px', fontWeight: 800, letterSpacing: '-1.5px', marginBottom: '24px', lineHeight: 1.15 }}>
          Our Mission is <span style={{ color: '#F42B03' }}>True Secure Connection</span>
        </h1>
        <p style={{ fontSize: '20px', lineHeight: 1.6, color: '#55575E' }}>
          We believe privacy is an absolute human right, and online team communication should be fast, elegant, and completely sovereign.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '60px', alignItems: 'center', marginBottom: '60px' }}>
        <div>
          <h2 style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.8px', marginBottom: '20px', color: '#17181C' }}>The MeetFlow Story</h2>
          <p style={{ fontSize: '17px', lineHeight: 1.65, color: '#55575E', marginBottom: '20px' }}>
            MeetFlow was founded in 2025 by a small team of open-source developers who grew tired of standard video platforms reading metadata, recording calls, and keeping encryption keys inside cloud databases. 
          </p>
          <p style={{ fontSize: '17px', lineHeight: 1.65, color: '#55575E', marginBottom: '0px' }}>
            We engineered a WebRTC-based architecture that delegates all cryptography directly to the client browser. MeetFlow servers never see your video frames or whiteboard drawing paths—making it impossible for outsiders or hosting companies to access meetings.
          </p>
        </div>
        <div style={{ background: 'linear-gradient(210deg, #FF9A3D 0%, #FF5A1F 45%, #F42B03 100%)', borderRadius: '24px', height: '320px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', boxShadow: '0 25px 50px rgba(244,43,3,0.2)' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundImage: 'radial-gradient(rgba(255,255,255,0.25) 1.5px, transparent 1.5px)', backgroundSize: '18px 18px' }}></div>
          <div style={{ zIndex: 1, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', padding: '24px 32px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.3)', color: '#ffffff', textAlign: 'center' }}>
            <h4 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 6px 0' }}>100% Client-Side</h4>
            <p style={{ fontSize: '14px', margin: 0, fontWeight: 600 }}>Decentralized, Peer-to-Peer Encryption</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '30px' }}>
        <div className="pricing-card-wrap" style={{ background: '#ffffff', border: '1px solid #E8E2DC', borderRadius: '18px', padding: '30px', textAlign: 'center', boxShadow: '0 10px 25px rgba(23,24,28,0.02)' }}>
          <h3 style={{ fontSize: '40px', fontWeight: 800, color: '#F42B03', margin: '0 0 10px 0' }}>2.5k+</h3>
          <p style={{ fontSize: '15px', color: '#55575E', fontWeight: 600, margin: 0 }}>Registered developers & teams</p>
        </div>
        <div className="pricing-card-wrap" style={{ background: '#ffffff', border: '1px solid #E8E2DC', borderRadius: '18px', padding: '30px', textAlign: 'center', boxShadow: '0 10px 25px rgba(23,24,28,0.02)' }}>
          <h3 style={{ fontSize: '40px', fontWeight: 800, color: '#F42B03', margin: '0 0 10px 0' }}>0</h3>
          <p style={{ fontSize: '15px', color: '#55575E', fontWeight: 600, margin: 0 }}>Data leaks or decrypted logs</p>
        </div>
        <div className="pricing-card-wrap" style={{ background: '#ffffff', border: '1px solid #E8E2DC', borderRadius: '18px', padding: '30px', textAlign: 'center', boxShadow: '0 10px 25px rgba(23,24,28,0.02)' }}>
          <h3 style={{ fontSize: '40px', fontWeight: 800, color: '#F42B03', margin: '0 0 10px 0' }}>99.9%</h3>
          <p style={{ fontSize: '15px', color: '#55575E', fontWeight: 600, margin: 0 }}>Uptime peer handshake relay servers</p>
        </div>
      </div>
    </div>
  )
}

function CareersSubpage() {
  const positions = [
    { title: "Senior WebRTC/Media Engineer", type: "Remote / Full-Time", dept: "Engineering", desc: "Scale our decentralized media pipeline and optimize browser WebRTC connection reliability." },
    { title: "Cryptography & Security Systems Architect", type: "Remote / Full-Time", dept: "Security", desc: "Design and audit client-side end-to-end cryptographic handshakes using WebCrypto APIs." },
    { title: "UI/UX Product Designer", type: "Remote / Contract", dept: "Design", desc: "Craft pixel-perfect interfaces for our video dashboard, whiteboard canvas, and dark mode screens." }
  ]

  return (
    <div style={{ zIndex: 2, position: 'relative', maxWidth: '1120px', margin: '0 auto', padding: '40px 56px 120px 56px', color: '#1A1B1F' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center', marginBottom: '60px' }}>
        <h1 style={{ fontSize: '52px', fontWeight: 800, letterSpacing: '-1.5px', marginBottom: '24px', lineHeight: 1.15 }}>
          Join the <span style={{ color: '#F42B03' }}>MeetFlow Team</span>
        </h1>
        <p style={{ fontSize: '20px', lineHeight: 1.6, color: '#55575E' }}>
          Help us build the next generation of highly secure, client-side encrypted communication products for remote teams globally.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '30px', marginBottom: '80px' }}>
        <div className="pricing-card-wrap" style={{ background: '#ffffff', border: '1px solid #E8E2DC', borderRadius: '20px', padding: '36px', boxShadow: '0 10px 25px rgba(23,24,28,0.02)' }}>
          <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#1A1B1F', margin: '0 0 10px 0' }}>Privacy-First Culture</h3>
          <p style={{ fontSize: '15px', lineHeight: 1.6, color: '#55575E', margin: 0 }}>We value privacy in our code and in our daily work. Absolute autonomy and trust.</p>
        </div>
        <div className="pricing-card-wrap" style={{ background: '#ffffff', border: '1px solid #E8E2DC', borderRadius: '20px', padding: '36px', boxShadow: '0 10px 25px rgba(23,24,28,0.02)' }}>
          <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#1A1B1F', margin: '0 0 10px 0' }}>Fully Distributed</h3>
          <p style={{ fontSize: '15px', lineHeight: 1.6, color: '#55575E', margin: 0 }}>Work from anywhere in the world. Async-first schedules, meetings only when needed.</p>
        </div>
        <div className="pricing-card-wrap" style={{ background: '#ffffff', border: '1px solid #E8E2DC', borderRadius: '20px', padding: '36px', boxShadow: '0 10px 25px rgba(23,24,28,0.02)' }}>
          <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#1A1B1F', margin: '0 0 10px 0' }}>Open Source Drive</h3>
          <p style={{ fontSize: '15px', lineHeight: 1.6, color: '#55575E', margin: 0 }}>We contribute heavily back to web standards, cryptography libraries, and frameworks.</p>
        </div>
      </div>

      <div>
        <h2 style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.8px', marginBottom: '32px', color: '#17181C', textAlign: 'center' }}>Open Opportunities</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {positions.map((p) => (
            <div key={p.title} className="pricing-card-wrap" style={{ background: '#ffffff', border: '1px solid #E8E2DC', borderRadius: '20px', padding: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '24px', boxShadow: '0 8px 24px rgba(23,24,28,0.01)' }}>
              <div style={{ maxWidth: '640px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#F42B03', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '6px' }}>{p.dept} • {p.type}</span>
                <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#1A1B1F', margin: '0 0 8px 0' }}>{p.title}</h3>
                <p style={{ fontSize: '15px', color: '#55575E', margin: 0, lineHeight: 1.5 }}>{p.desc}</p>
              </div>
              <button onClick={() => toast.success("Application wizard is opening shortly.")} style={{ background: '#17181C', color: '#ffffff', border: 'none', borderRadius: '12px', padding: '12px 24px', fontSize: '15px', fontWeight: 700, cursor: 'pointer', transition: 'opacity 0.2s' }} className="btn-hover-glow">
                Apply Now
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ContactSubpage() {
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    toast.success("Thank you! Your message has been sent successfully.")
  }

  return (
    <div style={{ zIndex: 2, position: 'relative', maxWidth: '1120px', margin: '0 auto', padding: '40px 56px 120px 56px', color: '#1A1B1F' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center', marginBottom: '60px' }}>
        <h1 style={{ fontSize: '52px', fontWeight: 800, letterSpacing: '-1.5px', marginBottom: '24px', lineHeight: 1.15 }}>
          Get in <span style={{ color: '#F42B03' }}>Touch</span>
        </h1>
        <p style={{ fontSize: '20px', lineHeight: 1.6, color: '#55575E' }}>
          Have technical questions about E2EE cryptography, custom private cloud deployments, or need help? We're online.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '60px', alignItems: 'start' }}>
        {/* Contact Form */}
        <div className="pricing-card-wrap" style={{ background: '#ffffff', border: '1px solid #E8E2DC', borderRadius: '24px', padding: '40px', boxShadow: '0 10px 35px rgba(23,24,28,0.02)' }}>
          {submitted ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(244,43,3,0.1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', color: '#F42B03' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <h3 style={{ fontSize: '24px', fontWeight: 800, color: '#17181C', margin: '0 0 10px 0' }}>Message Sent!</h3>
              <p style={{ fontSize: '15px', color: '#55575E', margin: 0 }}>We typically reply within 2 hours.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', gap: '20px' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 700, color: '#17181C' }}>Your Name</label>
                  <input required type="text" placeholder="John Doe" style={{ width: '100%', padding: '12px 16px', border: '1px solid #E8E2DC', borderRadius: '12px', background: '#FAFAFA', outline: 'none', fontSize: '15px' }} />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 700, color: '#17181C' }}>Email Address</label>
                  <input required type="email" placeholder="john@company.com" style={{ width: '100%', padding: '12px 16px', border: '1px solid #E8E2DC', borderRadius: '12px', background: '#FAFAFA', outline: 'none', fontSize: '15px' }} />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: 700, color: '#17181C' }}>Subject</label>
                <input required type="text" placeholder="Technical/Sales Inquiry" style={{ width: '100%', padding: '12px 16px', border: '1px solid #E8E2DC', borderRadius: '12px', background: '#FAFAFA', outline: 'none', fontSize: '15px' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: 700, color: '#17181C' }}>Message</label>
                <textarea required rows={5} placeholder="How can we help your team?" style={{ width: '100%', padding: '12px 16px', border: '1px solid #E8E2DC', borderRadius: '12px', background: '#FAFAFA', outline: 'none', fontSize: '15px', resize: 'vertical' }} />
              </div>
              <button type="submit" style={{ width: '100%', padding: '14px', background: 'linear-gradient(150deg, #FF6A2E, #FF3E1D)', color: '#ffffff', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: 700, cursor: 'pointer', transition: 'opacity 0.2s', marginTop: '8px' }} className="btn-hover-glow">
                Send Message
              </button>
            </form>
          )}
        </div>

        {/* Contact Info cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="pricing-card-wrap" style={{ background: '#ffffff', border: '1px solid #E8E2DC', borderRadius: '20px', padding: '28px', display: 'flex', gap: '20px', alignItems: 'start', boxShadow: '0 8px 24px rgba(23,24,28,0.01)' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#FFF0EC', color: '#F42B03', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            </div>
            <div>
              <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#17181C', margin: '0 0 4px 0' }}>Security Team</h4>
              <p style={{ fontSize: '14px', color: '#55575E', margin: '0 0 6px 0', lineHeight: 1.4 }}>To submit vulnerability disclosures or inspect PGP logs.</p>
              <span style={{ fontSize: '15px', fontWeight: 700, color: '#F42B03' }}>security@meetflow.com</span>
            </div>
          </div>

          <div className="pricing-card-wrap" style={{ background: '#ffffff', border: '1px solid #E8E2DC', borderRadius: '20px', padding: '28px', display: 'flex', gap: '20px', alignItems: 'start', boxShadow: '0 8px 24px rgba(23,24,28,0.01)' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#FFF0EC', color: '#F42B03', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
            <div>
              <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#17181C', margin: '0 0 4px 0' }}>General Support</h4>
              <p style={{ fontSize: '14px', color: '#55575E', margin: '0 0 6px 0', lineHeight: 1.4 }}>Troubleshooting assistance and integration workflows.</p>
              <span style={{ fontSize: '15px', fontWeight: 700, color: '#F42B03' }}>support@meetflow.com</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function SecuritySubpage() {
  const audits = [
    { title: "E2EE Handshake Library Audit", date: "June 15, 2026", auditor: "Cure53", status: "Verified Secure", desc: "Full penetration test and code audit of our WebCrypto Diffie-Hellman handshake flow. Zero vulnerabilities found." },
    { title: "Relay Server TLS 1.3 Compliance Check", date: "May 10, 2026", auditor: "Internal Security", status: "Passed", desc: "Verification of TLS 1.3 protocol requirements on TURN/STUN relay servers to block sniffing." },
    { title: "Client-Side Storage PGP Audit", date: "April 28, 2026", auditor: "OpenSource Community", status: "Verified Secure", desc: "Audit of sessionStorage/localStorage encryptors mapping authentication tokens." }
  ]

  return (
    <div style={{ zIndex: 2, position: 'relative', maxWidth: '1120px', margin: '0 auto', padding: '40px 56px 120px 56px', color: '#1A1B1F' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center', marginBottom: '60px' }}>
        <h1 style={{ fontSize: '52px', fontWeight: 800, letterSpacing: '-1.5px', marginBottom: '24px', lineHeight: 1.15 }}>
          Security & <span style={{ color: '#F42B03' }}>Transparency Logs</span>
        </h1>
        <p style={{ fontSize: '20px', lineHeight: 1.6, color: '#55575E' }}>
          We publish all cryptographic audits, library signatures, and server configurations to ensure absolute verification of your communications.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {audits.map((a) => (
          <div key={a.title} className="pricing-card-wrap" style={{ background: '#ffffff', border: '1px solid #E8E2DC', borderRadius: '20px', padding: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '24px', boxShadow: '0 8px 24px rgba(23,24,28,0.01)' }}>
            <div style={{ maxWidth: '720px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#F42B03', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{a.auditor}</span>
                <span style={{ color: '#E8E2DC' }}>•</span>
                <span style={{ fontSize: '13px', color: '#9A9CA3', fontWeight: 600 }}>{a.date}</span>
              </div>
              <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#1A1B1F', margin: '0 0 8px 0' }}>{a.title}</h3>
              <p style={{ fontSize: '15px', color: '#55575E', margin: 0, lineHeight: 1.5 }}>{a.desc}</p>
            </div>
            <span style={{ background: '#E6F4EA', color: '#137333', fontSize: '13px', fontWeight: 700, padding: '6px 14px', borderRadius: '999px', display: 'inline-block' }}>
              {a.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function StatusSubpage() {
  const components = [
    { name: "Signaling Gateway", uptime: "100%", status: "Operational" },
    { name: "TURN/STUN Handshake Relays", uptime: "99.98%", status: "Operational" },
    { name: "E2EE Key Exchange Broker", uptime: "100%", status: "Operational" },
    { name: "Main Web Application Server", uptime: "99.99%", status: "Operational" }
  ]

  return (
    <div style={{ zIndex: 2, position: 'relative', maxWidth: '960px', margin: '0 auto', padding: '40px 56px 120px 56px', color: '#1A1B1F' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center', marginBottom: '60px' }}>
        <h1 style={{ fontSize: '52px', fontWeight: 800, letterSpacing: '-1.5px', marginBottom: '24px', lineHeight: 1.15 }}>
          Systems <span style={{ color: '#F42B03' }}>Status</span>
        </h1>
        <p style={{ fontSize: '20px', lineHeight: 1.6, color: '#55575E' }}>
          Live updates on MeetFlow signaling channels, relay infrastructure, and app availability.
        </p>
      </div>

      {/* Main Status Banner */}
      <div style={{ background: '#E6F4EA', border: '1px solid #C2E7CB', borderRadius: '18px', padding: '24px', display: 'flex', alignItems: 'center', gap: '16px', color: '#137333', fontSize: '17px', fontWeight: 700, marginBottom: '40px', boxShadow: '0 8px 24px rgba(19,115,51,0.04)' }}>
        <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#137333', display: 'inline-block', boxShadow: '0 0 10px #137333' }}></span>
        All Systems Operational — Uptime relay connection active.
      </div>

      <div className="pricing-card-wrap" style={{ background: '#ffffff', border: '1px solid #E8E2DC', borderRadius: '24px', padding: '36px', boxShadow: '0 10px 30px rgba(23,24,28,0.02)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {components.map((c, idx) => (
          <div key={c.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: idx === components.length - 1 ? 'none' : '1px solid #F1ECE6' }}>
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#17181C', margin: '0 0 4px 0' }}>{c.name}</h3>
              <span style={{ fontSize: '13px', color: '#9A9CA3', fontWeight: 600 }}>Uptime past 90 days: {c.uptime}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '14px', fontWeight: 700, color: '#137333' }}>{c.status}</span>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#137333', display: 'inline-block' }}></span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function PrivacySubpage() {
  return (
    <div style={{ zIndex: 2, position: 'relative', maxWidth: '960px', margin: '0 auto', padding: '40px 56px 120px 56px', color: '#1A1B1F' }}>
      <div style={{ marginBottom: '40px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '46px', fontWeight: 800, letterSpacing: '-1.5px', marginBottom: '16px', lineHeight: 1.15 }}>
          Privacy <span style={{ color: '#F42B03' }}>Policy</span>
        </h1>
        <p style={{ fontSize: '18px', lineHeight: 1.6, color: '#55575E' }}>
          Last updated: July 5, 2026. Your data privacy is our core engineering mission.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', fontSize: '16px', lineHeight: 1.65, color: '#2C2E35', background: '#ffffff', border: '1px solid #E8E2DC', borderRadius: '24px', padding: '48px', boxShadow: '0 10px 30px rgba(23,24,28,0.02)' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#17181C', marginBottom: '12px' }}>1. Zero Data Retention & Media Logging</h2>
          <p style={{ margin: 0 }}>
            MeetFlow is built using secure WebRTC technology. We do not store, view, or record your video calls, screen shares, or microphone streams. All media data is transmitted directly peer-to-peer between meeting participants. Our signaling relays only facilitate connections and cannot access your conversation.
          </p>
        </div>

        <div style={{ borderTop: '1px solid #F1ECE6', paddingTop: '24px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#17181C', marginBottom: '12px' }}>2. Client-Side Cryptography (E2EE)</h2>
          <p style={{ margin: 0 }}>
            When End-to-End Encryption (E2EE) is enabled, your text messages and collaborative whiteboard data are encrypted directly inside your browser before transmission. The decryption keys remain exclusively on your device, making it mathematically impossible for MeetFlow or third parties to decrypt your data.
          </p>
        </div>

        <div style={{ borderTop: '1px solid #F1ECE6', paddingTop: '24px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#17181C', marginBottom: '12px' }}>3. Information We Collect</h2>
          <p style={{ margin: 0 }}>
            We only collect basic account data required for registration and system access: your email, chosen display name, and securely hashed passwords. Your profile photos are converted and stored locally in your browser storage or transmitted via standard secure API protocols.
          </p>
        </div>

        <div style={{ borderTop: '1px solid #F1ECE6', paddingTop: '24px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#17181C', marginBottom: '12px' }}>4. Cookies & Persistent Storage</h2>
          <p style={{ margin: 0 }}>
            We do not use tracking or advertising cookies. We utilize browser local storage to keep your session authenticated and to persist your workspace UI preferences (such as avatar settings, sound level preferences, and theme choices).
          </p>
        </div>
      </div>
    </div>
  )
}

function TermsSubpage() {
  return (
    <div style={{ zIndex: 2, position: 'relative', maxWidth: '960px', margin: '0 auto', padding: '40px 56px 120px 56px', color: '#1A1B1F' }}>
      <div style={{ marginBottom: '40px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '46px', fontWeight: 800, letterSpacing: '-1.5px', marginBottom: '16px', lineHeight: 1.15 }}>
          Terms of <span style={{ color: '#F42B03' }}>Service</span>
        </h1>
        <p style={{ fontSize: '18px', lineHeight: 1.6, color: '#55575E' }}>
          Last updated: July 5, 2026. Please read these terms carefully.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', fontSize: '16px', lineHeight: 1.65, color: '#2C2E35', background: '#ffffff', border: '1px solid #E8E2DC', borderRadius: '24px', padding: '48px', boxShadow: '0 10px 30px rgba(23,24,28,0.02)' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#17181C', marginBottom: '12px' }}>1. Acceptance of Agreement</h2>
          <p style={{ margin: 0 }}>
            By registering for or using the MeetFlow workspace, you explicitly agree to follow and be bound by these Terms of Service. If you do not agree with these conditions, you must not use our service. We reserve the right to revise these terms at any time.
          </p>
        </div>

        <div style={{ borderTop: '1px solid #F1ECE6', paddingTop: '24px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#17181C', marginBottom: '12px' }}>2. Account Security & Verification</h2>
          <p style={{ margin: 0 }}>
            You are entirely responsible for protecting your account credentials and passwords. You agree to provide accurate registration information and represent that your account will not be utilized for fraudulent, abusive, or unauthorized purposes.
          </p>
        </div>

        <div style={{ borderTop: '1px solid #F1ECE6', paddingTop: '24px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#17181C', marginBottom: '12px' }}>3. Permitted Service Usage</h2>
          <p style={{ margin: 0 }}>
            MeetFlow is provided to host real-time team meetings, whiteboard tasks, and instant chats. You agree not to overload our peer-handshake relay servers, perform penetration tests without authorization, or utilize channels to distribute illegal media content.
          </p>
        </div>

        <div style={{ borderTop: '1px solid #F1ECE6', paddingTop: '24px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#17181C', marginBottom: '12px' }}>4. Disclaimer & Liability Limits</h2>
          <p style={{ margin: 0 }}>
            MeetFlow is delivered on an "as is" and "as available" basis. MeetFlow, its team, and developers do not guarantee 100% uninterrupted availability and shall not be held liable for any data loss, communication interruptions, or damages arising from your usage of the platform.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function AuthPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [loading, setLoading] = useState(false)
  
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin")
  const [modalOpen, setModalOpen] = useState(false)

  const [subpage, setSubpage] = useState<"home" | "product" | "features" | "pricing" | "resources" | "about" | "careers" | "contact" | "security" | "status" | "privacy" | "terms">(() => {
    const path = window.location.pathname
    if (path === "/product") return "product"
    if (path === "/features") return "features"
    if (path === "/pricing") return "pricing"
    if (path === "/resources") return "resources"
    if (path === "/about") return "about"
    if (path === "/careers") return "careers"
    if (path === "/contact") return "contact"
    if (path === "/security") return "security"
    if (path === "/status") return "status"
    if (path === "/privacy") return "privacy"
    if (path === "/terms") return "terms"
    return "home"
  })

  const handleNavigate = (page: "home" | "product" | "features" | "pricing" | "resources" | "about" | "careers" | "contact" | "security" | "status" | "privacy" | "terms") => {
    const path = page === "home" ? "/" : `/${page}`
    window.history.pushState(null, "", path)
    setSubpage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  useEffect(() => {
    const handlePop = () => {
      const path = window.location.pathname
      if (path === "/product") setSubpage("product")
      else if (path === "/features") setSubpage("features")
      else if (path === "/pricing") setSubpage("pricing")
      else if (path === "/resources") setSubpage("resources")
      else if (path === "/about") setSubpage("about")
      else if (path === "/careers") setSubpage("careers")
      else if (path === "/contact") setSubpage("contact")
      else if (path === "/security") setSubpage("security")
      else if (path === "/status") setSubpage("status")
      else if (path === "/privacy") setSubpage("privacy")
      else if (path === "/terms") setSubpage("terms")
      else setSubpage("home")
    }
    window.addEventListener("popstate", handlePop)
    return () => window.removeEventListener("popstate", handlePop)
  }, [])

  const [seconds, setSeconds] = useState(24 * 60 * 60 + 18 * 60 + 30) // Initial timer state

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds(prev => prev + 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const formatTimer = () => {
    const hh = String(Math.floor(seconds / 3600)).padStart(2, '0')
    const mm = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0')
    const ss = String(seconds % 60).padStart(2, '0')
    return `${hh}:${mm}:${ss}`
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.login(email, password)
      toast.success("Signed in successfully!")
      window.dispatchEvent(new Event("auth-changed"))
    } catch (error: any) {
      toast.error(error.message || "Failed to sign in")
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!displayName.trim()) {
      toast.error("Display name is required")
      return
    }
    setLoading(true)
    try {
      await api.register(email, password, email, displayName.trim())
      toast.success("Account created and signed in!")
      window.dispatchEvent(new Event("auth-changed"))
    } catch (error: any) {
      toast.error(error.message || "Registration failed")
    } finally {
      setLoading(false)
    }
  }

  const openAuth = (mode: "signin" | "signup") => {
    setAuthMode(mode)
    setModalOpen(true)
  }

  const renderIcon = (name: string, color: string) => {
    const p = { 
      width: 26, 
      height: 26, 
      viewBox: '0 0 24 24', 
      fill: 'none', 
      stroke: color, 
      strokeWidth: 2.2, 
      strokeLinecap: 'round' as const, 
      strokeLinejoin: 'round' as const 
    };
    
    if (name === 'video') {
      return (
        <svg width="26" height="26" viewBox="0 0 24 24" fill={color}>
          <rect x="2" y="6" width="13" height="12" rx="3" />
          <path d="M16 10.5 21 7.5 v9 L16 13.5" />
        </svg>
      );
    }
    if (name === 'shield') {
      return (
        <svg {...p}>
          <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      );
    }
    if (name === 'users') {
      return (
        <svg {...p}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    }
    return (
      <svg {...p}>
        <path d="M18 8V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h8" />
        <path d="M7 19h5" />
        <rect width="6" height="10" x="16" y="12" rx="2" />
      </svg>
    );
  };

  const participants = [
    { name: 'James Wilson', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=180&h=210&q=80', micColor: '#39D26A' },
    { name: 'Olivia Brown', img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=180&h=210&q=80', micColor: '#39D26A' },
    { name: 'Daniel Taylor', img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=180&h=210&q=80', micColor: '#39D26A' },
    { name: 'Sophia Lee', img: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=180&h=210&q=80', micColor: '#39D26A' },
    { name: 'Ethan Davis', img: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=180&h=210&q=80', micColor: '#39D26A' },
    { name: 'Emma Johnson', img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=180&h=210&q=80', micColor: '#F45B3B' }
  ];

  const features = [
    { title: 'High-Quality Video', text: 'Crystal-clear HD video and audio for seamless communication.', tileBg: '#1e1616', icon: renderIcon('video', '#FF4A16') },
    { title: 'Secure Meetings', text: 'End-to-end encryption ensures your meetings are always private.', tileBg: '#1e1a16', icon: renderIcon('shield', '#FF7A1F') },
    { title: 'Team Collaboration', text: 'Share screens, chat, and collaborate in real-time with your team.', tileBg: '#1f1616', icon: renderIcon('users', '#F42B03') },
    { title: 'Access Anywhere', text: 'Join meetings from any device, anytime, anywhere.', tileBg: '#1c1c1c', icon: renderIcon('devices', '#FF4A16') }
  ];

  return (
    <div className="root-container">
      <style dangerouslySetInnerHTML={{ __html: `
        /* === Desktop Base Styles matching paste exactly === */
        .root-container {
          font-family: 'Plus Jakarta Sans', sans-serif;
          background: #FBF6F1;
          color: #17181C;
          min-width: 1280px;
          overflow: hidden;
          min-height: 100vh;
        }
        @keyframes blobFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(14px); }
        }
        @keyframes pulseLive {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.45; transform: scale(1.1); }
        }
        @keyframes whiteboardFloat {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-6px) rotate(1.2deg); }
        }
        .animate-blob-float {
          animation: blobFloat 7s ease-in-out infinite;
        }
        .pulse-live-dot {
          animation: pulseLive 2s infinite ease-in-out;
          transform-origin: center;
        }
        .whiteboard-float-art {
          animation: whiteboardFloat 5s infinite ease-in-out;
        }
        .nav-link {
          position: relative;
        }
        .nav-link::after {
          content: '';
          position: absolute;
          bottom: -4px;
          left: 0;
          width: 0;
          height: 2px;
          background-color: #F42B03;
          transition: width 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .nav-link:hover::after {
          width: 100%;
        }
        .nav-link:hover {
          color: #F42B03 !important;
        }
        .social-icon-link:hover {
          color: #ffffff !important;
        }
        .footer-link-btn {
          transition: color 0.2s ease-in-out;
        }
        .footer-link-btn:hover {
          color: #ffffff !important;
        }
        .pricing-card-wrap {
          transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .pricing-card-wrap:hover {
          transform: translateY(-8px);
        }
        .btn-hover-glow:hover {
          filter: brightness(1.06);
          box-shadow: 0 10px 28px rgba(229,38,3,0.4) !important;
        }
        .btn-hover-white:hover {
          border-color: #d8d2cc !important;
          background-color: #fcfbfa !important;
          color: #17181C !important;
        }

        /* === Desktop Grid & Elements === */
        .accent-dot-1 {
          position: absolute;
          top: 112px;
          left: 54%;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: linear-gradient(135deg, #FF8A3D, #F42B03);
          z-index: 1;
        }
        .accent-dot-2 {
          position: absolute;
          top: 318px;
          left: 40.5%;
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background: radial-gradient(circle at 35% 30%, #FF7A3D, #E52B03);
          box-shadow: 0 6px 14px rgba(244,43,3,0.35);
          z-index: 1;
        }
        .nav-header {
          position: relative;
          z-index: 2;
          max-width: 1480px;
          margin: 0 auto;
          padding: 24px 56px;
          display: flex;
          align-items: center;
          gap: 40px;
        }
        .hero-grid {
          position: relative;
          z-index: 2;
          max-width: 1480px;
          margin: 0 auto;
          padding: 40px 56px 150px 56px;
          display: grid;
          grid-template-columns: 460px 1fr;
          gap: 90px;
          align-items: center;
        }
        .headline-title {
          margin: 0;
          font-size: 58px;
          line-height: 1.1;
          font-weight: 800;
          letter-spacing: -1.8px;
          color: #1A1B1F;
        }
        .hero-buttons-container {
          display: flex;
          align-items: center;
          gap: 18px;
          margin-top: 8px;
        }
        .video-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          grid-template-rows: 210px 210px;
          gap: 5px;
          padding: 0 14px;
        }
        .controls-bar {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 22px 18px 22px;
        }
        .wave-container {
          position: relative;
          margin-top: -140px;
          line-height: 0;
        }
        .wave-svg {
          display: block;
          width: 100%;
          height: 190px;
        }
        .features-section {
          background: #101216; 
          padding: 24px 56px 80px 56px;
        }
        .features-grid {
          max-width: 1480px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr 1fr 1fr 1fr;
        }
        .feature-card {
          padding: 8px 40px 8px 40px;
          border-left: 1px solid rgba(255,255,255,0.06);
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .feature-card-first {
          border-left: none !important;
        }
        .feature-card-title {
          font-size: 22px;
          font-weight: 800;
          color: #ffffff;
          letter-spacing: -0.4px;
        }
        .feature-card-text {
          font-size: 17px;
          line-height: 1.6;
          color: #9A9CA3;
        }
        .mockup-badge {
          position: absolute;
          left: 10px;
          bottom: 10px;
          display: flex;
          align-items: center;
          gap: 7px;
          background: rgba(12, 13, 15, 0.72);
          border-radius: 6px;
          padding: 5px 10px;
          transition: all 0.2s;
        }
        .mockup-badge-text {
          color: #ffffff;
          font-size: 13px;
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 100px;
          display: inline-block;
        }

        /* === Responsive Overrides for Mobile & Tablet (Only under 1280px) === */
        @media (max-width: 1279px) {
          .mockup-badge {
            left: 4px !important;
            bottom: 4px !important;
            padding: 3px 5px !important;
            gap: 4px !important;
            border-radius: 4px !important;
          }
          .mockup-badge-text {
            font-size: 8px !important;
            max-width: 50px !important;
          }
          .mockup-badge svg {
            width: 8px !important;
            height: 8px !important;
          }
          .root-container {
            min-width: 100% !important;
            width: 100% !important;
          }
          .accent-dot-1, .accent-dot-2 {
            display: none !important;
          }
          .nav-header {
            padding: 16px 20px !important;
            gap: 16px !important;
          }
          .nav-buttons-wrap {
            gap: 12px !important;
          }
          .nav-btn-signin {
            font-size: 14px !important;
          }
          .nav-btn-signup {
            padding: 8px 16px !important;
            font-size: 13px !important;
            border-radius: 8px !important;
          }
          .hero-grid {
            grid-template-columns: 1fr !important;
            gap: 48px !important;
            padding: 24px 20px 80px 20px !important;
          }
          .headline-title {
            font-size: 38px !important;
            letter-spacing: -1px !important;
          }
          .hero-buttons-container {
            flex-direction: column !important;
            align-items: stretch !important;
            width: 100% !important;
            gap: 12px !important;
          }
          .hero-buttons-container > button {
            width: 100% !important;
            justify-content: center !important;
          }
          .video-grid {
            grid-template-rows: auto !important;
            grid-auto-rows: minmax(110px, auto) !important;
            padding: 0 8px !important;
            gap: 3px !important;
          }
          .video-tile {
            aspect-ratio: 4/3 !important;
          }
          .controls-bar {
            padding: 10px 12px !important;
            gap: 6px !important;
            flex-wrap: wrap !important;
            justify-content: center !important;
          }
          .control-btn-hangup {
            width: 56px !important;
            margin-left: 6px !important;
          }
          .controls-side-actions {
            display: none !important;
          }
          .wave-container {
            margin-top: -60px !important;
          }
          .wave-svg {
            height: 100px !important;
          }
          .features-section {
            padding: 40px 20px 60px 20px !important;
          }
          .features-grid {
            grid-template-columns: 1fr !important;
            gap: 20px !important;
          }
          .feature-card {
            padding: 20px 0 !important;
            border-left: none !important;
            border-top: 1px solid rgba(255,255,255,0.06) !important;
          }
          .feature-card-first {
            border-top: none !important;
          }
        }
      `}} />

      {/* ===== HERO (cream) ===== */}
      <div style={{ position: 'relative', overflow: 'hidden' }}>

        {/* Perfect top-right "gorka" SVG matching mockup 1:1 */}
        <div style={{ position: 'absolute', top: 0, right: 0, width: '100%', height: '100%', overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
          <svg viewBox="0 0 1440 900" preserveAspectRatio="none" style={{ width: '1440px', height: '900px', position: 'absolute', top: 0, right: 0 }}>
            <defs>
              <linearGradient id="gorkaGrad" x1="1" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FF9A3D" />
                <stop offset="50%" stopColor="#FF5A1F" />
                <stop offset="100%" stopColor="#F42B03" />
              </linearGradient>
              <linearGradient id="gorkaGlow" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#FF5A1F" stopOpacity="0" />
              </linearGradient>
              <pattern id="dotPattern" x="0" y="0" width="18" height="18" patternUnits="userSpaceOnUse">
                <circle cx="9" cy="9" r="1.5" fill="rgba(255,255,255,0.22)" />
              </pattern>
            </defs>
            {/* The sweeping diagonal orange shape */}
            <path d="M1440,0 L850,0 C980,350 930,680 1440,740 Z" fill="url(#gorkaGrad)" />
            {/* Dotted pattern overlay restricted to the shape */}
            <path d="M1440,0 L850,0 C980,350 930,680 1440,740 Z" fill="url(#dotPattern)" />
            {/* Glowing edge line */}
            <path d="M850,0 C980,350 930,680 1440,740" fill="none" stroke="url(#gorkaGlow)" strokeWidth="5" />
          </svg>
        </div>

        {/* accent dots */}
        <div className="accent-dot-1"></div>
        <div className="accent-dot-2"></div>

        {/* NAV */}
        {/* NAV */}
        <div className="nav-header">
          <div onClick={() => handleNavigate("home")} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} className="select-none">
            <div style={{ width: '44px', height: '44px', borderRadius: '16px', background: 'linear-gradient(150deg, #FF6A2E, #FF3E1D)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 14px rgba(255,106,46,0.25)' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="6" width="13" height="12" rx="3" fill="#ffffff" stroke="none"></rect>
                <path d="M16 10.5 21 7.5 v9 L16 13.5" fill="#ffffff" stroke="none"></path>
              </svg>
            </div>
            <div style={{ fontSize: '27px', fontWeight: 800, letterSpacing: '-0.5px', color: '#17181C' }}>
              <span>Meet</span><span style={{ color: '#FF6A2E' }}>Flow</span>
            </div>
          </div>
          <div className="hidden md:flex" style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: '52px', fontSize: '17px', fontWeight: 600, color: '#26272B' }}>
            <button onClick={() => handleNavigate("product")} className="nav-link" style={{ background: 'none', border: 'none', padding: 0, fontSize: '17px', fontWeight: 600, color: '#26272B', cursor: 'pointer', transition: 'color 0.2s' }}>Product</button>
            <button onClick={() => handleNavigate("features")} className="nav-link" style={{ background: 'none', border: 'none', padding: 0, fontSize: '17px', fontWeight: 600, color: '#26272B', cursor: 'pointer', transition: 'color 0.2s' }}>Features</button>
            <button onClick={() => handleNavigate("pricing")} className="nav-link" style={{ background: 'none', border: 'none', padding: 0, fontSize: '17px', fontWeight: 600, color: '#26272B', cursor: 'pointer', transition: 'color 0.2s' }}>Pricing</button>
            <button onClick={() => handleNavigate("resources")} className="nav-link" style={{ background: 'none', border: 'none', padding: 0, fontSize: '17px', fontWeight: 600, color: '#26272B', cursor: 'pointer', transition: 'color 0.2s' }}>Resources</button>
            <button onClick={() => handleNavigate("about")} className="nav-link" style={{ background: 'none', border: 'none', padding: 0, fontSize: '17px', fontWeight: 600, color: '#26272B', cursor: 'pointer', transition: 'color 0.2s' }}>About Us</button>
          </div>
          <div className="nav-buttons-wrap" style={{ display: 'flex', alignItems: 'center', gap: '22px' }}>
            <button onClick={() => openAuth("signin")} className="nav-btn-signin" style={{ background: 'none', border: 'none', fontSize: '17px', fontWeight: 600, color: '#ffffff', cursor: 'pointer' }}>Sign in</button>
            <button 
              onClick={() => openAuth("signup")} 
              className="btn-hover-white nav-btn-signup"
              style={{ fontWeight: 700, color: '#ffffff', textDecoration: 'none', background: 'rgba(255,255,255,0.16)', border: '1px solid rgba(255,255,255,0.45)', padding: '13px 26px', borderRadius: '12px', backdropFilter: 'blur(4px)', transition: 'all 0.2s', cursor: 'pointer' }}
            >
              Get Started Free
            </button>
          </div>
        </div>

        {/* SWITCHER BETWEEN HERO AND MARKETING SUBPAGES */}
        {subpage === "home" && (
          <div className="hero-grid">

            {/* Left column */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '26px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#F6E9E3', borderRadius: '999px', padding: '11px 20px', color: '#E52B03', fontSize: '15px', fontWeight: 600 }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#E52B03" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
                <span>Meet, collaborate, and succeed together</span>
              </div>

              <h1 className="headline-title">
                Video meetings <span style={{ color: '#F42B03' }}>made simple.</span> Connections <span style={{ color: '#F42B03' }}>made stronger.</span>
              </h1>

              <p style={{ margin: 0, fontSize: '19px', lineHeight: 1.6, color: '#55575E', maxWidth: '430px' }}>
                MeetFlow is a secure, reliable, and easy-to-use video conferencing platform for teams of all sizes.
              </p>

              <div className="hero-buttons-container">
                <button 
                  onClick={() => openAuth("signup")} 
                  className="btn-hover-glow"
                  style={{ border: 'none', display: 'flex', alignItems: 'center', gap: '10px', background: 'linear-gradient(150deg, #FF4A16, #E52603)', color: '#ffffff', fontSize: '15px', fontWeight: 700, textDecoration: 'none', padding: '13px 22px', borderRadius: '11px', boxShadow: '0 8px 20px rgba(229,38,3,0.25)', cursor: 'pointer', transition: 'all 0.2s' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#ffffff">
                    <rect x="2" y="6" width="13" height="12" rx="3"></rect>
                    <path d="M16 10.5 21 7.5 v9 L16 13.5"></path>
                  </svg>
                  Start a Free Meeting
                </button>
                <button 
                  onClick={() => openAuth("signin")} 
                  className="btn-hover-white"
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#ffffff', color: '#1A1B1F', fontSize: '15px', fontWeight: 700, textDecoration: 'none', padding: '13px 22px', borderRadius: '11px', border: '1px solid #E8E2DC', boxShadow: '0 4px 12px rgba(23,24,28,0.05)', cursor: 'pointer', transition: 'all 0.2s' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1A1B1F" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="3"></rect>
                    <path d="M16 2v4"></path>
                    <path d="M8 2v4"></path>
                    <path d="M3 10h18"></path>
                  </svg>
                  Schedule a Meeting
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '12px' }}>
                <div style={{ display: 'flex' }}>
                  <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&h=80&q=80" alt="" style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #FBF6F1' }} />
                  <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&h=80&q=80" alt="" style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #FBF6F1', marginLeft: '-14px' }} />
                  <img src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=80&h=80&q=80" alt="" style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #FBF6F1', marginLeft: '-14px' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <div style={{ display: 'flex', gap: '3px' }}>
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} width="19" height="19" viewBox="0 0 24 24" fill="#FF8A00">
                        <path d="M12 2l2.9 6.26 6.6.72-4.9 4.55 1.34 6.47L12 16.77 6.06 20l1.34-6.47L2.5 8.98l6.6-.72z"></path>
                      </svg>
                    ))}
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: '#45474D' }}>4.9/5 from 2,500+ users</div>
                </div>
              </div>
            </div>

            {/* Right column: meeting panel */}
            <div className="animate-blob-float" style={{ position: 'relative', background: '#17181C', border: '5px solid #0C0D0F', borderRadius: '22px', boxShadow: '0 40px 80px rgba(15,10,8,0.35)', overflow: 'hidden' }}>
              {/* panel header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 22px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#F42B03' }}></div>
                <div style={{ color: '#ffffff', fontSize: '17px', fontWeight: 700 }}>Team Sync Meeting</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#FF4A16', fontSize: '13px', fontWeight: 800, letterSpacing: '0.5px' }}>
                  <div className="pulse-live-dot" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#FF4A16' }}></div>
                  LIVE
                </div>
                <div style={{ color: '#9A9CA3', fontSize: '15px', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{formatTimer()}</div>
                <div style={{ flex: 1 }}></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#E8E9EC', fontSize: '15px', fontWeight: 600 }}>
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#E8E9EC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                  6
                </div>
                <svg style={{ marginLeft: '14px' }} width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#E8E9EC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                <svg style={{ marginLeft: '10px' }} width="19" height="19" viewBox="0 0 24 24" fill="#E8E9EC"><circle cx="12" cy="5" r="1.6"></circle><circle cx="12" cy="12" r="1.6"></circle><circle cx="12" cy="19" r="1.6"></circle></svg>
              </div>

              {/* video grid */}
              <div className="video-grid">
                {participants.map((p) => (
                  <div key={p.name} className="video-tile" style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', background: '#26272C' }}>
                    <img src={p.img} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', display: 'block' }} />
                    <div className="mockup-badge">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={p.micColor} strokeWidth="2.4" strokeLinecap="round">
                        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                        <line x1="12" y1="19" x2="12" y2="22"></line>
                      </svg>
                      <span className="mockup-badge-text">{p.name}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* controls */}
              <div className="controls-bar">
                <div style={{ width: '46px', height: '46px', borderRadius: '50%', background: '#26272C', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="22"></line></svg>
                </div>
                <div style={{ width: '46px', height: '46px', borderRadius: '50%', background: '#26272C', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="#ffffff"><rect x="2" y="6" width="13" height="12" rx="3"></rect><path d="M16 10.5 21 7.5 v9 L16 13.5"></path></svg>
                </div>
                <div style={{ width: '46px', height: '46px', borderRadius: '50%', background: '#26272C', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"></rect><path d="m9 10 3-3 3 3"></path><path d="M12 13V7"></path><path d="M12 17v4"></path><path d="M8 21h8"></path></svg>
                </div>
                <div style={{ width: '46px', height: '46px', borderRadius: '50%', background: '#26272C', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                </div>
                <div style={{ width: '46px', height: '46px', borderRadius: '50%', background: '#26272C', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                </div>
                <div className="btn-hover-glow control-btn-hangup" style={{ width: '76px', height: '46px', borderRadius: '999px', background: 'linear-gradient(150deg, #FF4A16, #E52603)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: '14px', cursor: 'pointer', boxShadow: '0 6px 16px rgba(229,38,3,0.4)', transition: 'all 0.2s' }}>
                  <svg style={{ transform: 'rotate(135deg)', transformOrigin: 'center' }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                </div>
                <div style={{ flex: 1 }} className="controls-side-actions"></div>
                <div className="controls-side-actions" style={{ display: 'flex', alignItems: 'center', gap: '22px' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C9CBD1" strokeWidth="2" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"></rect><rect x="14" y="3" width="7" height="7" rx="1.5"></rect><rect x="3" y="14" width="7" height="7" rx="1.5"></rect><rect x="14" y="14" width="7" height="7" rx="1.5"></rect></svg>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#C9CBD1" strokeWidth="2"></circle><circle cx="12" cy="12" r="4" fill="#F42B03"></circle></svg>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C9CBD1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"></path></svg>
                </div>
              </div>
            </div>
          </div>
        )}
        {subpage === "product" && <ProductSubpage openAuth={openAuth} />}
        {subpage === "features" && <FeaturesSubpage openAuth={openAuth} />}
        {subpage === "pricing" && <PricingSubpage openAuth={openAuth} />}
        {subpage === "resources" && <ResourcesSubpage />}
        {subpage === "about" && <AboutSubpage />}
        {subpage === "careers" && <CareersSubpage />}
        {subpage === "contact" && <ContactSubpage />}
        {subpage === "security" && <SecuritySubpage />}
        {subpage === "status" && <StatusSubpage />}
        {subpage === "privacy" && <PrivacySubpage />}
        {subpage === "terms" && <TermsSubpage />}
      </div>

      {/* ===== WAVE DIVIDER ===== */}
      <div className="wave-container">
        <svg viewBox="0 0 1440 190" preserveAspectRatio="none" className="wave-svg">
          <defs>
            <linearGradient id="mfWave" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#F42B03"></stop>
              <stop offset="50%" stopColor="#FF6A1F"></stop>
              <stop offset="100%" stopColor="#FF9A3D"></stop>
            </linearGradient>
            <filter id="mfGlow" x="-20%" y="-100%" width="140%" height="300%">
              <feGaussianBlur stdDeviation="7"></feGaussianBlur>
            </filter>
          </defs>
          <rect x="0" y="0" width="1440" height="190" fill="#101216"></rect>
          <path d="M0,0 H1440 V52 C1230,132 1010,18 730,54 C470,88 220,138 0,58 Z" fill="#FBF6F1"></path>
          <path d="M0,58 C220,138 470,88 730,54 C1010,18 1230,132 1440,52" fill="none" stroke="url(#mfWave)" strokeWidth="10" filter="url(#mfGlow)" opacity="0.8"></path>
          <path d="M0,58 C220,138 470,88 730,54 C1010,18 1230,132 1440,52" fill="none" stroke="url(#mfWave)" strokeWidth="4"></path>
          <path d="M0,190 H1440 V168 C1120,140 420,196 0,158 Z" fill="#101216"></path>
        </svg>
      </div>

      {/* ===== FEATURES ===== */}
      <div className="features-section">
        <div className="features-grid">
          {features.map((f, i) => (
            <div 
              key={f.title} 
              className={`feature-card ${i === 0 ? 'feature-card-first' : ''}`}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
                <div style={{ width: '62px', height: '62px', borderRadius: '16px', background: f.tileBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid rgba(255,255,255,0.08)' }}>
                  <span style={{ display: 'flex' }}>{f.icon}</span>
                </div>
                <div className="feature-card-title">{f.title}</div>
              </div>
              <div className="feature-card-text">{f.text}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ===== FOOTER ===== */}
      <div style={{ background: '#101216', padding: '0 56px 40px 56px', borderTop: '1px solid rgba(255,255,255,0.05)', color: '#55575E' }}>
        <div style={{ maxWidth: '1480px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '30px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '40px', paddingTop: '40px' }}>
            {/* Left Brand & Socials Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', maxWidth: '300px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(150deg, #FF5A1F, #E52603)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="6" width="13" height="12" rx="3" fill="#ffffff" stroke="none"></rect>
                    <path d="M16 10.5 21 7.5 v9 L16 13.5" fill="#ffffff" stroke="none"></path>
                  </svg>
                </div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.3px' }}>Meet<span style={{ color: '#F42B03' }}>Flow</span></div>
              </div>
              <p style={{ fontSize: '14px', lineHeight: 1.6, margin: 0 }}>
                Next-generation client-side encrypted video communications. Absolute sovereignty over your team connection.
              </p>
              
              {/* Social Networks Links */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '4px' }}>
                {/* X / Twitter */}
                <a href="https://x.com" target="_blank" rel="noopener noreferrer" style={{ color: '#55575E', transition: 'color 0.2s' }} className="social-icon-link">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
                {/* GitHub */}
                <a href="https://github.com" target="_blank" rel="noopener noreferrer" style={{ color: '#55575E', transition: 'color 0.2s' }} className="social-icon-link">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/>
                    <path d="M9 18c-4.51 2-5-2-7-2"/>
                  </svg>
                </a>
                {/* Discord */}
                <a href="https://discord.com" target="_blank" rel="noopener noreferrer" style={{ color: '#55575E', transition: 'color 0.2s' }} className="social-icon-link">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                  </svg>
                </a>
              </div>
            </div>

            {/* Links Columns Group */}
            <div style={{ display: 'flex', gap: '80px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <span style={{ color: '#ffffff', fontWeight: 700, fontSize: '15px' }}>Platform</span>
                <button onClick={() => handleNavigate("product")} style={{ background: 'none', border: 'none', padding: 0, color: '#9A9CA3', fontSize: '14px', textAlign: 'left', cursor: 'pointer' }} className="footer-link-btn">Product</button>
                <button onClick={() => handleNavigate("features")} style={{ background: 'none', border: 'none', padding: 0, color: '#9A9CA3', fontSize: '14px', textAlign: 'left', cursor: 'pointer' }} className="footer-link-btn">Features</button>
                <button onClick={() => handleNavigate("pricing")} style={{ background: 'none', border: 'none', padding: 0, color: '#9A9CA3', fontSize: '14px', textAlign: 'left', cursor: 'pointer' }} className="footer-link-btn">Pricing</button>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <span style={{ color: '#ffffff', fontWeight: 700, fontSize: '15px' }}>Resources</span>
                <button onClick={() => handleNavigate("resources")} style={{ background: 'none', border: 'none', padding: 0, color: '#9A9CA3', fontSize: '14px', textAlign: 'left', cursor: 'pointer' }} className="footer-link-btn">Documentation</button>
                <button onClick={() => handleNavigate("security")} style={{ background: 'none', border: 'none', padding: 0, color: '#9A9CA3', fontSize: '14px', textAlign: 'left', cursor: 'pointer' }} className="footer-link-btn">Security Logs</button>
                <button onClick={() => handleNavigate("status")} style={{ background: 'none', border: 'none', padding: 0, color: '#9A9CA3', fontSize: '14px', textAlign: 'left', cursor: 'pointer' }} className="footer-link-btn">Systems Status</button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <span style={{ color: '#ffffff', fontWeight: 700, fontSize: '15px' }}>Company</span>
                <button onClick={() => handleNavigate("about")} style={{ background: 'none', border: 'none', padding: 0, color: '#9A9CA3', fontSize: '14px', textAlign: 'left', cursor: 'pointer' }} className="footer-link-btn">About Us</button>
                <button onClick={() => handleNavigate("careers")} style={{ background: 'none', border: 'none', padding: 0, color: '#9A9CA3', fontSize: '14px', textAlign: 'left', cursor: 'pointer' }} className="footer-link-btn">Careers</button>
                <button onClick={() => handleNavigate("contact")} style={{ background: 'none', border: 'none', padding: 0, color: '#9A9CA3', fontSize: '14px', textAlign: 'left', cursor: 'pointer' }} className="footer-link-btn">Contact</button>
              </div>
            </div>

            {/* Newsletter Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '300px' }}>
              <span style={{ color: '#ffffff', fontWeight: 700, fontSize: '15px' }}>Stay Secure</span>
              <p style={{ fontSize: '13px', lineHeight: 1.5, margin: 0, color: '#9A9CA3' }}>
                Subscribe to get notified about new E2EE security audits, protocol logs, and feature releases.
              </p>
              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <input 
                  type="email" 
                  placeholder="name@company.com" 
                  style={{ 
                    background: 'rgba(255,255,255,0.04)', 
                    border: '1px solid rgba(255,255,255,0.08)', 
                    borderRadius: '8px', 
                    color: '#ffffff', 
                    fontSize: '13px', 
                    padding: '8px 12px', 
                    flex: 1, 
                    outline: 'none',
                    minWidth: '0'
                  }} 
                />
                <button 
                  style={{ 
                    background: '#ffffff', 
                    color: '#101216', 
                    border: 'none', 
                    borderRadius: '8px', 
                    fontSize: '13px', 
                    fontWeight: 700, 
                    padding: '8px 14px', 
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                  className="btn-hover-white"
                >
                  Join
                </button>
              </div>
            </div>
          </div>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '20px', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.04)', fontSize: '13px' }}>
            <span>© 2026 MeetFlow Inc. All rights reserved.</span>
            
            <div style={{ display: 'flex', gap: '24px' }}>
              <button onClick={() => handleNavigate("privacy")} style={{ background: 'none', border: 'none', padding: 0, color: '#55575E', fontSize: '13px', cursor: 'pointer', transition: 'color 0.2s' }} className="footer-link-btn">Privacy Policy</button>
              <button onClick={() => handleNavigate("terms")} style={{ background: 'none', border: 'none', padding: 0, color: '#55575E', fontSize: '13px', cursor: 'pointer', transition: 'color 0.2s' }} className="footer-link-btn">Terms of Service</button>
            </div>
          </div>
        </div>
      </div>

      {/* Auth Modal (Dialog) */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md bg-white text-slate-900 border border-slate-100 rounded-2xl p-6">
          <div className="flex justify-center mb-2">
            <div className="flex items-center gap-2.5 select-none">
              <div className="w-8 h-8 bg-gradient-to-br from-[#FF6A2E] to-[#FF3E1D] rounded-xl flex items-center justify-center shadow-md shadow-orange-500/20 shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="6" width="13" height="12" rx="3" fill="#ffffff" stroke="none"></rect>
                  <path d="M16 10.5 21 7.5 v9 L16 13.5" fill="#ffffff" stroke="none"></path>
                </svg>
              </div>
              <span className="text-lg font-extrabold tracking-tight">
                <span className="text-stone-900">Meet</span>
                <span className="text-[#FF6A2E]">Flow</span>
              </span>
            </div>
          </div>
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-2xl font-bold tracking-tight text-center">Welcome to MeetFlow</DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              {authMode === "signin" ? "Sign in to your account" : "Create a new free account"}
            </DialogDescription>
          </DialogHeader>
          
          <Tabs value={authMode} onValueChange={(val) => setAuthMode(val as "signin" | "signup")} className="w-full mt-4">
            <TabsList className="w-full bg-slate-100 p-1 rounded-xl mb-6">
              <TabsTrigger value="signin" className="flex-1 rounded-lg text-sm font-semibold">Sign In</TabsTrigger>
              <TabsTrigger value="signup" className="flex-1 rounded-lg text-sm font-semibold">Create Account</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin" className="mt-0">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-11 rounded-xl border-slate-200"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-11 rounded-xl border-slate-200"
                  />
                </div>
                <Button type="submit" className="w-full h-11 bg-gradient-to-r from-orange-500 to-red-600 hover:scale-[1.01] active:scale-[0.99] transition-all text-white font-semibold rounded-xl mt-2 border-none cursor-pointer" disabled={loading}>
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup" className="mt-0">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="signup-name">Display Name</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="Jane Smith"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                    className="h-11 rounded-xl border-slate-200"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-11 rounded-xl border-slate-200"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="min. 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={6}
                    required
                    className="h-11 rounded-xl border-slate-200"
                  />
                </div>
                <Button type="submit" className="w-full h-11 bg-gradient-to-r from-orange-500 to-red-600 hover:scale-[1.01] active:scale-[0.99] transition-all text-white font-semibold rounded-xl mt-2 border-none cursor-pointer" disabled={loading}>
                  {loading ? "Creating account..." : "Create Account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  )
}
