import { useState, useMemo, useEffect } from 'react';
import {
  Info, HelpCircle, Mail, Shield, AlertTriangle, FileText,
  HeartHandshake, XCircle, Send, ChevronDown, Search, CheckCircle, UploadCloud
} from 'lucide-react';
import { PublicLayout } from '../components/layout/PublicLayout';
import { supportConfig } from '../lib/supportConfig';

interface SupportHubProps {
  activeTab: string;
  onNavigate: (page: string) => void;
}

const TABS = [
  { id: 'about', label: 'About Us', icon: Info, group: 'Support' },
  { id: 'faq', label: 'FAQs', icon: HelpCircle, group: 'Support' },
  { id: 'contact', label: 'Contact Us', icon: Mail, group: 'Support' },
  { id: 'safety', label: 'Safety & Trust', icon: Shield, group: 'Safety' },
  { id: 'report_abuse', label: 'Report Abuse', icon: AlertTriangle, group: 'Safety' },
  { id: 'terms', label: 'Terms of Service', icon: FileText, group: 'Legal' },
  { id: 'privacy', label: 'Privacy Policy', icon: FileText, group: 'Legal' },
  { id: 'cookie_policy', label: 'Cookie Policy', icon: FileText, group: 'Legal' },
  { id: 'dispute_policy', label: 'Dispute Resolution', icon: HeartHandshake, group: 'Legal' },
  { id: 'cancellation_policy', label: 'Cancellation Policy', icon: XCircle, group: 'Legal' },
];

export function SupportHub({ activeTab, onNavigate }: SupportHubProps) {
  // Safe state mapping
  const currentTab = TABS.find(t => t.id === activeTab) ? activeTab : 'about';

  // Contact Form States
  const [contactForm, setContactForm] = useState({ name: '', email: '', subject: '', role: 'client', message: '' });
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [contactTicket, setContactTicket] = useState('');

  // Report Abuse Form States
  const [abuseForm, setAbuseForm] = useState({ name: '', email: '', target: '', reason: 'scam', details: '' });
  const [abuseSubmitted, setAbuseSubmitted] = useState(false);
  const [abuseTicket, setAbuseTicket] = useState('');
  const [fileAttached, setFileAttached] = useState<string | null>(null);

  // FAQ Search States
  const [faqSearch, setFaqSearch] = useState('');
  const [faqCategory, setFaqCategory] = useState<'all' | 'general' | 'client' | 'artisan'>('all');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  // Sync scroll to top on tab change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentTab]);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.name || !contactForm.email || !contactForm.message) return;
    const ticketId = 'CMT-' + Math.floor(100000 + Math.random() * 900000);
    setContactTicket(ticketId);
    setContactSubmitted(true);
  };

  const handleAbuseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!abuseForm.name || !abuseForm.email || !abuseForm.target || !abuseForm.details) return;
    const ticketId = 'REP-' + Math.floor(100000 + Math.random() * 900000);
    setAbuseTicket(ticketId);
    setAbuseSubmitted(true);
  };

  // FAQ List Data
  const faqs = [
    {
      q: `What is ${supportConfig.company_name}?`,
      a: `${supportConfig.company_name} is a verified marketplace platform connecting clients in Ghana with qualified, trust-screened local artisans. The platform makes it easy to find, message, and book skilled trades professionals, from carpenters and painters to tailors and beauty experts.`,
      cat: 'general'
    },
    {
      q: 'How does the artisan verification process work?',
      a: 'Verification is a structured process involving multiple levels. Identity Verification (Level 1) ensures the artisan\'s name, face, and Ghana Card ID are authentic. Professional Verification (Level 2) checks their experience, training background, and professional references. Premium Verification (Level 3) adds a physical shop audit and client history review.',
      cat: 'general'
    },
    {
      q: `Is ${supportConfig.company_name} an academic or educational project?`,
      a: `${supportConfig.company_name} is currently a Final Year Project designed and developed by a dedicated team of student engineers (Peniel, Kwabena, and Nhyira). It represents a high-standard educational prototype built to address trust and reliability challenges in Ghana\'s informal labor market.`,
      cat: 'general'
    },
    {
      q: 'How do I book an artisan?',
      a: 'Search or browse categories, select a verified artisan, and tap "Request Booking" or post a job. You can chat in real-time to discuss scope and budget before confirming the contract.',
      cat: 'client'
    },
    {
      q: 'What should I do if an artisan does poor work or disappears?',
      a: 'You should immediately document the work (photos) and contact our mediation support team. Do not release payments if they are still held in escrow. Read our Dispute Policy tab for detailed steps on resolving quality or execution issues.',
      cat: 'client'
    },
    {
      q: `Are artisans on ${supportConfig.company_name} employees of the company?`,
      a: `No. Verified artisans are independent contractors. ${supportConfig.company_name} acts as an escrow-secure marketplace and verification portal, but does not employ, schedule, or supervise the artisans.`,
      cat: 'client'
    },
    {
      q: 'Does it cost money to get verified?',
      a: 'Artisan verification is completely free during this educational stage. We require active Ghana Cards, contactable reference details, and clear photos of your recent work to verify profiles.',
      cat: 'artisan'
    },
    {
      q: 'How do I check my verification status?',
      a: 'You can check your current verification application status at any time by going to the "Check Status" page on the portal and entering your application number (e.g. APP-123456) or phone number.',
      cat: 'artisan'
    },
    {
      q: 'What happens if my verification application is rejected?',
      a: 'If rejected, you will receive an SMS and email outlining the reason (e.g. blurry ID photo, invalid references). You can update your details or upload new documents in the app to request a re-review.',
      cat: 'artisan'
    }
  ];

  const filteredFaqs = useMemo(() => {
    return faqs.filter(faq => {
      const matchSearch = faq.q.toLowerCase().includes(faqSearch.toLowerCase()) || faq.a.toLowerCase().includes(faqSearch.toLowerCase());
      const matchCat = faqCategory === 'all' || faq.cat === faqCategory;
      return matchSearch && matchCat;
    });
  }, [faqSearch, faqCategory]);

  return (
    <PublicLayout onNavigate={onNavigate}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-20">
        {/* Header section */}
        <div className="mb-10 text-center md:text-left">
          <h1 className="text-3xl font-extrabold text-text-primary tracking-tight">Support & Legal Portal</h1>
          <p className="mt-2 text-sm text-text-muted">Find documentation, safety guidelines, and support tools for the {supportConfig.company_name} platform.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar navigation */}
          <div className="lg:col-span-1">
            {/* Desktop Navigation */}
            <div className="hidden lg:block space-y-6 sticky top-24">
              {['Support', 'Safety', 'Legal'].map(groupName => {
                const groupItems = TABS.filter(t => t.group === groupName);
                return (
                  <div key={groupName} className="space-y-1.5">
                    <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider px-3">{groupName}</h3>
                    <nav className="space-y-1">
                      {groupItems.map(tab => {
                        const Icon = tab.icon;
                        const isActive = currentTab === tab.id;
                        return (
                          <button
                            key={tab.id}
                            onClick={() => onNavigate(tab.id)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 text-left
                              ${isActive
                                ? 'bg-primary text-white shadow-primary-glow'
                                : 'text-text-secondary hover:bg-neutral-100 hover:text-text-primary'}`}
                          >
                            <Icon size={16} className="flex-shrink-0" />
                            {tab.label}
                          </button>
                        );
                      })}
                    </nav>
                  </div>
                );
              })}
            </div>

            {/* Mobile Navigation Dropdown */}
            <div className="block lg:hidden relative mb-6">
              <label htmlFor="support-tab-select" className="text-xs font-bold text-text-muted mb-1 block">Jump to section:</label>
              <div className="relative">
                <select
                  id="support-tab-select"
                  value={currentTab}
                  onChange={(e) => onNavigate(e.target.value)}
                  className="input-field py-3 pr-10 appearance-none font-semibold text-text-primary cursor-pointer w-full"
                >
                  {TABS.map(tab => (
                    <option key={tab.id} value={tab.id}>
                      {tab.group} › {tab.label}
                    </option>
                  ))}
                </select>
                <ChevronDown size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Content panel */}
          <div className="lg:col-span-3 card p-6 md:p-8 min-h-[500px]">
            {/* ABOUT US TAB */}
            {currentTab === 'about' && (
              <div className="space-y-6 animate-fade-in text-text-secondary text-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary-50 flex items-center justify-center text-primary flex-shrink-0">
                    <Info size={24} />
                  </div>
                  <h2 className="text-2xl font-bold text-text-primary">About {supportConfig.company_name}</h2>
                </div>
                
                <p className="leading-relaxed">
                  {supportConfig.company_name} is Ghana's premier artisan verification portal and marketplace network. Born out of a mission to sanitize the local skilled trades industry, {supportConfig.company_name} addresses the critical issue of trust, reliability, and security between homeowners/businesses and local artisans.
                </p>

                <div className="border-l-4 border-primary bg-primary-50/30 p-4 rounded-r-xl my-6">
                  <h4 className="font-bold text-text-primary text-sm mb-1">🎓 Educational Project Notice</h4>
                  <p className="text-xs">
                    {supportConfig.company_name} is designed and developed as a **Final Year Project** by student developers. It serves as an advanced prototype and research artifact aimed at testing labor formalization theories and secure digital transaction escrow models in West Africa.
                  </p>
                </div>

                <h3 className="text-lg font-bold text-text-primary mt-6 mb-3">Our Core Team</h3>
                <div className="grid sm:grid-cols-3 gap-4 mt-2">
                  {supportConfig.team_members.map(member => (
                    <div key={member.name} className="p-4 bg-neutral-50 rounded-xl border border-neutral-100">
                      <p className="font-bold text-text-primary">{member.name}</p>
                      <p className="text-xs text-primary font-semibold mb-2">{member.role}</p>
                      <p className="text-xs text-text-muted leading-relaxed">{member.desc}</p>
                    </div>
                  ))}
                </div>

                <h3 className="text-lg font-bold text-text-primary mt-6 mb-3">Ghanaian Trades Formalization</h3>
                <p className="leading-relaxed">
                  By standardizing catalog categorization (carpentry, tailors, bricklayers, cobblers) and introducing formal review checks, we provide Ghanaian micro-business workers with a digital portfolio that builds their credit of trust, unlocking economic opportunities that were historically hindered by lack of credentials.
                </p>
              </div>
            )}

            {/* FAQS TAB */}
            {currentTab === 'faq' && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary-50 flex items-center justify-center text-primary flex-shrink-0">
                    <HelpCircle size={24} />
                  </div>
                  <h2 className="text-2xl font-bold text-text-primary">Frequently Asked Questions</h2>
                </div>

                {/* FAQ Filters */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input
                      type="text"
                      placeholder="Search FAQs..."
                      value={faqSearch}
                      onChange={e => setFaqSearch(e.target.value)}
                      className="input-field pl-9 text-sm w-full"
                    />
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {[
                      { id: 'all', label: 'All' },
                      { id: 'general', label: 'General' },
                      { id: 'client', label: 'For Clients' },
                      { id: 'artisan', label: 'For Artisans' }
                    ].map(cat => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setFaqCategory(cat.id as any)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors
                          ${faqCategory === cat.id
                            ? 'bg-primary text-white'
                            : 'bg-neutral-100 text-text-secondary hover:bg-neutral-200'}`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* FAQ List */}
                <div className="divide-y divide-neutral-100 mt-4 border border-neutral-100 rounded-xl overflow-hidden bg-white">
                  {filteredFaqs.map((faq, i) => {
                    const isExpanded = expandedFaq === i;
                    return (
                      <div key={i} className="hover:bg-neutral-50/50 transition-colors">
                        <button
                          type="button"
                          onClick={() => setExpandedFaq(isExpanded ? null : i)}
                          className="w-full text-left p-4 font-bold text-text-primary text-sm flex items-center justify-between gap-4"
                        >
                          <span>{faq.q}</span>
                          <ChevronDown size={16} className={`text-text-muted transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                        {isExpanded && (
                          <div className="px-4 pb-4 text-xs text-text-secondary leading-relaxed animate-slide-up">
                            {faq.a}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {filteredFaqs.length === 0 && (
                    <div className="p-8 text-center text-text-muted text-xs">
                      No matching questions found. Try typing another keyword.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* CONTACT US TAB */}
            {currentTab === 'contact' && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary-50 flex items-center justify-center text-primary flex-shrink-0">
                    <Mail size={24} />
                  </div>
                  <h2 className="text-2xl font-bold text-text-primary">Contact Support</h2>
                </div>

                {contactSubmitted ? (
                  <div className="card p-6 border-success/30 bg-success-light/30 text-center space-y-4 max-w-md mx-auto">
                    <div className="w-12 h-12 bg-success rounded-full flex items-center justify-center mx-auto text-white">
                      <CheckCircle size={24} />
                    </div>
                    <h3 className="font-bold text-text-primary text-lg">Message Submitted Successfully</h3>
                    <p className="text-xs text-text-secondary">
                      Thank you for contacting {supportConfig.company_name}. We have received your query. A support ticket has been created:
                    </p>
                    <div className="p-2 bg-white rounded-lg border font-mono text-sm font-bold text-primary">
                      {contactTicket}
                    </div>
                    <p className="text-[10px] text-text-muted">
                      Our support team will reach out to you via the provided email within 24 business hours.
                    </p>
                    <button
                      type="button"
                      onClick={() => { setContactSubmitted(false); setContactForm({ name: '', email: '', subject: '', role: 'client', message: '' }); }}
                      className="btn-secondary text-xs px-4 py-2 mt-2 w-full justify-center"
                    >
                      Send another message
                    </button>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-5 gap-6">
                    <form onSubmit={handleContactSubmit} className="md:col-span-3 space-y-4">
                      <div>
                        <label className="label text-xs">Full Name <span className="text-error">*</span></label>
                        <input
                          type="text"
                          required
                          value={contactForm.name}
                          onChange={e => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                          className="input-field text-sm"
                          placeholder="e.g. John Doe"
                        />
                      </div>
                      <div>
                        <label className="label text-xs">Email Address <span className="text-error">*</span></label>
                        <input
                          type="email"
                          required
                          value={contactForm.email}
                          onChange={e => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                          className="input-field text-sm"
                          placeholder="johndoe@example.com"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="label text-xs">Role</label>
                          <div className="relative">
                            <select
                              value={contactForm.role}
                              onChange={e => setContactForm(prev => ({ ...prev, role: e.target.value }))}
                              className="input-field text-xs py-2 appearance-none pr-8 cursor-pointer w-full"
                            >
                              <option value="client">Client / Customer</option>
                              <option value="artisan">Artisan / Worker</option>
                              <option value="other">Other</option>
                            </select>
                            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                          </div>
                        </div>
                        <div>
                          <label className="label text-xs">Subject</label>
                          <input
                            type="text"
                            value={contactForm.subject}
                            onChange={e => setContactForm(prev => ({ ...prev, subject: e.target.value }))}
                            className="input-field text-sm"
                            placeholder="e.g. Account Help"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="label text-xs">Message <span className="text-error">*</span></label>
                        <textarea
                          required
                          rows={4}
                          value={contactForm.message}
                          onChange={e => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                          className="input-field text-sm min-h-[100px] resize-none"
                          placeholder="Describe your issue or query..."
                        />
                      </div>
                      <button type="submit" className="btn-primary text-xs px-6 py-2.5 w-full sm:w-auto justify-center">
                        <Send size={14} />
                        Submit Request
                      </button>
                    </form>

                    <div className="md:col-span-2 space-y-4 text-xs text-text-secondary bg-neutral-50 p-5 rounded-xl border border-neutral-100/50 self-start">
                      <h4 className="font-bold text-text-primary text-sm mb-2">Direct Contact Channels</h4>
                      <div>
                        <p className="font-semibold text-text-primary mb-0.5">Primary Support Email</p>
                        <a href={`mailto:${supportConfig.support_email}`} className="text-primary hover:underline">{supportConfig.support_email}</a>
                      </div>
                      <div>
                        <p className="font-semibold text-text-primary mb-0.5">Developer Escalations</p>
                        <a href={`mailto:${supportConfig.escalation_email}`} className="text-primary hover:underline">{supportConfig.escalation_email}</a>
                      </div>
                      <div className="pt-2 border-t">
                        <p className="font-semibold text-text-primary mb-0.5">Campus Project Office</p>
                        <p className="text-text-muted">{supportConfig.office_address}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* SAFETY & TRUST TAB */}
            {currentTab === 'safety' && (
              <div className="space-y-6 animate-fade-in text-text-secondary text-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary-50 flex items-center justify-center text-primary flex-shrink-0">
                    <Shield size={24} />
                  </div>
                  <h2 className="text-2xl font-bold text-text-primary">Safety & Trust Guidelines</h2>
                </div>

                <p className="leading-relaxed">
                  At {supportConfig.company_name}, keeping both clients and artisans safe is our top priority. We operate an offline-fulfilled marketplace, meaning jobs are completed face-to-face. We advise all users to adhere to the following safety precautions.
                </p>

                <div className="grid md:grid-cols-2 gap-6 my-6">
                  <div className="p-5 bg-neutral-50 border border-neutral-100 rounded-xl space-y-2">
                    <h3 className="font-bold text-text-primary text-sm flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-primary" />
                      For Customers / Clients
                    </h3>
                    <ul className="list-disc pl-4 space-y-1.5 text-xs">
                      <li>**Always check for the Verification Badge**: Only hire workers marked as verified to ensure their Ghana Cards have been validated.</li>
                      <li>**Meet in Safe Environments**: If a home visit is required, make sure someone else is present at home.</li>
                      <li>**Secure Payments**: Never pay full costs upfront. Pay via escrow or deposit, releasing final payment only upon job completion.</li>
                      <li>**Keep Chat Logs**: Discuss pricing and scopes inside the in-app chat for valid dispute logs.</li>
                    </ul>
                  </div>

                  <div className="p-5 bg-neutral-50 border border-neutral-100 rounded-xl space-y-2">
                    <h3 className="font-bold text-text-primary text-sm flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-gold-600" />
                      For Artisans / Workers
                    </h3>
                    <ul className="list-disc pl-4 space-y-1.5 text-xs">
                      <li>**Verify Client Location**: Confirm the physical work address before departing.</li>
                      <li>**Alert Others**: Let a family member or colleague know where you are going for a job.</li>
                      <li>**Document Work**: Take photographs of the job site before and after your task.</li>
                      <li>**Polite Conduct**: Avoid verbal altercations; if a customer becomes hostile, pack your tools, leave, and report the abuse.</li>
                    </ul>
                  </div>
                </div>

                <h3 className="text-base font-bold text-text-primary mt-6 mb-2">Ghana Card Identity Verification</h3>
                <p className="leading-relaxed">
                  Every verified artisan has provided a matching Ghana Card and a live selfie. This ensures that in the extremely rare event of theft or illegal activity, we can work directly with the Ghana Police Service, providing exact biometric identifiers for resolution.
                </p>
              </div>
            )}

            {/* REPORT ABUSE TAB */}
            {currentTab === 'report_abuse' && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary-50 flex items-center justify-center text-primary flex-shrink-0">
                    <AlertTriangle size={24} />
                  </div>
                  <h2 className="text-2xl font-bold text-text-primary">Report Misconduct / Abuse</h2>
                </div>

                <p className="text-sm text-text-secondary leading-relaxed">
                  If you have experienced harassment, fraud, profile misrepresentation, or unsafe behavior by an artisan or client, please report it immediately. Reports are treated with strict confidentiality.
                </p>

                {abuseSubmitted ? (
                  <div className="card p-6 border-error/20 bg-error-light/10 text-center space-y-4 max-w-md mx-auto">
                    <div className="w-12 h-12 bg-error rounded-full flex items-center justify-center mx-auto text-white">
                      <CheckCircle size={24} />
                    </div>
                    <h3 className="font-bold text-text-primary text-lg">Abuse Report Logged</h3>
                    <p className="text-xs text-text-secondary">
                      Thank you for reporting this incident. Your report has been logged under Incident ID:
                    </p>
                    <div className="p-2 bg-white rounded-lg border font-mono text-sm font-bold text-error">
                      {abuseTicket}
                    </div>
                    <p className="text-[10px] text-text-muted">
                      Our safety and compliance team will review the audit trail, chat history, and verification files. If necessary, the reported account will be suspended.
                    </p>
                    <button
                      type="button"
                      onClick={() => { setAbuseSubmitted(false); setFileAttached(null); setAbuseForm({ name: '', email: '', target: '', reason: 'scam', details: '' }); }}
                      className="btn-secondary text-xs px-4 py-2 mt-2 w-full justify-center"
                    >
                      File another report
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleAbuseSubmit} className="space-y-4 max-w-xl">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="label text-xs">Your Name <span className="text-error">*</span></label>
                        <input
                          type="text"
                          required
                          value={abuseForm.name}
                          onChange={e => setAbuseForm(prev => ({ ...prev, name: e.target.value }))}
                          className="input-field text-sm"
                          placeholder="Your Name"
                        />
                      </div>
                      <div>
                        <label className="label text-xs">Your Email Address <span className="text-error">*</span></label>
                        <input
                          type="email"
                          required
                          value={abuseForm.email}
                          onChange={e => setAbuseForm(prev => ({ ...prev, email: e.target.value }))}
                          className="input-field text-sm"
                          placeholder="yourname@domain.com"
                        />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="label text-xs">Reported User (Name or Phone) <span className="text-error">*</span></label>
                        <input
                          type="text"
                          required
                          value={abuseForm.target}
                          onChange={e => setAbuseForm(prev => ({ ...prev, target: e.target.value }))}
                          className="input-field text-sm"
                          placeholder="e.g. John Painter or 054..."
                        />
                      </div>
                      <div>
                        <label className="label text-xs">Reason for Report</label>
                        <div className="relative">
                          <select
                            value={abuseForm.reason}
                            onChange={e => setAbuseForm(prev => ({ ...prev, reason: e.target.value }))}
                            className="input-field text-xs py-2 appearance-none pr-8 cursor-pointer w-full"
                          >
                            <option value="scam">Scam / Financial Fraud</option>
                            <option value="harassment">Harassment / Abusive behavior</option>
                            <option value="no_show">Artisan No-Show after payment</option>
                            <option value="poor_workmanship">Severe Damage or Theft</option>
                            <option value="other">Other Violation</option>
                          </select>
                          <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="label text-xs">Incident Details <span className="text-error">*</span></label>
                      <textarea
                        required
                        rows={4}
                        value={abuseForm.details}
                        onChange={e => setAbuseForm(prev => ({ ...prev, details: e.target.value }))}
                        className="input-field text-sm min-h-[100px] resize-none"
                        placeholder="Provide details about what happened, date, and job context..."
                      />
                    </div>

                    <div>
                      <label className="label text-xs">Attach Evidence (Optional)</label>
                      <div className="border-2 border-dashed border-neutral-200 hover:border-primary/40 rounded-xl p-4 text-center cursor-pointer transition-colors"
                        onClick={() => setFileAttached("screenshot_evidence.png")}>
                        <UploadCloud size={24} className="text-text-muted mx-auto mb-1.5" />
                        <span className="text-xs font-semibold text-text-primary block">
                          {fileAttached ? `Selected: ${fileAttached}` : "Click to select a file (png, jpg, pdf)"}
                        </span>
                        <span className="text-[10px] text-text-muted">Max file size: 5MB</span>
                      </div>
                    </div>

                    <button type="submit" className="btn-primary text-xs px-6 py-2.5 bg-error hover:bg-error-dark justify-center">
                      <AlertTriangle size={14} />
                      File Incident Report
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* TERMS & CONDITIONS TAB */}
            {currentTab === 'terms' && (
              <div className="space-y-6 animate-fade-in text-text-secondary text-xs leading-relaxed max-h-[600px] overflow-y-auto pr-2 scrollbar-thin">
                <div className="flex items-center gap-3 mb-4 sticky top-0 bg-white py-2 z-10 border-b">
                  <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-primary flex-shrink-0">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-text-primary">Terms of Service</h2>
                    <p className="text-[10px] text-text-muted">Last updated: {supportConfig.last_updated}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-bold text-text-primary text-sm">1. Introduction</h3>
                  <p>
                    Welcome to {supportConfig.company_name} (“Company”, “we”, “our”, “us”)! These Terms of Service (“Terms”, “Terms of Service”) govern your use of our website located at {supportConfig.domain_name} (together or individually “Service”) operated by {supportConfig.company_name}.
                  </p>
                  <p>
                    Our Privacy Policy also governs your use of our Service and explains how we collect, safeguard and disclose information that results from your use of our web pages.
                  </p>
                  <p>
                    Your agreement with us includes these Terms and our Privacy Policy (“Agreements”). You acknowledge that you have read and understood Agreements, and agree to be bound of them.
                  </p>
                  <p>
                    If you do not agree with (or cannot comply with) Agreements, then you may not use the Service, but please let us know by emailing at {supportConfig.support_email} so we can try to find a solution. These Terms apply to all visitors, users and others who wish to access or use Service.
                  </p>

                  <h3 className="font-bold text-text-primary text-sm">2. Communications</h3>
                  <p>
                    By using our Service, you agree to subscribe to newsletters, marketing or promotional materials and other information we may send. However, you may opt out of receiving any, or all, of these communications from us by following the unsubscribe link or by emailing at {supportConfig.support_email}.
                  </p>

                  <h3 className="font-bold text-text-primary text-sm">3. Prohibited Uses</h3>
                  <p>
                    You may use Service only for lawful purposes and in accordance with Terms. You agree not to use Service:
                  </p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>In any way that violates any applicable national or international law or regulation.</li>
                    <li>To impersonate or attempt to impersonate Company, a Company employee, another user, or any other person or entity.</li>
                    <li>To engage in any other conduct that restricts or inhibits anyone’s use or enjoyment of Service.</li>
                  </ul>

                  <h3 className="font-bold text-text-primary text-sm">4. Intellectual Property</h3>
                  <p>
                    Service and its original content (excluding Content provided by users), features and functionality are and will remain the exclusive property of {supportConfig.company_name} and its licensors. Our trademarks may not be used in connection with any product or service without the prior written consent of {supportConfig.company_name}.
                  </p>

                  <h3 className="font-bold text-text-primary text-sm">5. Termination</h3>
                  <p>
                    We may terminate or suspend your account and bar access to Service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever and without limitation, including but not limited to a breach of Terms.
                  </p>

                  <h3 className="font-bold text-text-primary text-sm">6. Governing Law</h3>
                  <p>
                    These Terms shall be governed and construed in accordance with the laws of Ghana, which governing law applies to agreement without regard to its conflict of law provisions.
                  </p>

                  <h3 className="font-bold text-text-primary text-sm">7. Contact Us</h3>
                  <p>
                    Please send your feedback, comments, requests for technical support by email: <strong>{supportConfig.escalation_email}</strong>.
                  </p>
                </div>
              </div>
            )}

            {/* PRIVACY POLICY TAB */}
            {currentTab === 'privacy' && (
              <div className="space-y-6 animate-fade-in text-text-secondary text-xs leading-relaxed max-h-[600px] overflow-y-auto pr-2 scrollbar-thin">
                <div className="flex items-center gap-3 mb-4 sticky top-0 bg-white py-2 z-10 border-b">
                  <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-primary flex-shrink-0">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-text-primary">Privacy Policy</h2>
                    <p className="text-[10px] text-text-muted">Effective date: {supportConfig.effective_date}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-bold text-text-primary text-sm">1. Introduction</h3>
                  <p>
                    Welcome to {supportConfig.company_name}. {supportConfig.company_name} (“us”, “we”, or “our”) operates {supportConfig.domain_name} (hereinafter referred to as “Service”). Our Privacy Policy governs your visit to {supportConfig.domain_name}, and explains how we collect, safeguard and disclose information that results from your use of our Service.
                  </p>

                  <h3 className="font-bold text-text-primary text-sm">2. Definitions</h3>
                  <p>
                    <strong>SERVICE</strong> means the {supportConfig.domain_name} website operated by {supportConfig.company_name}.<br />
                    <strong>PERSONAL DATA</strong> means data about a living individual who can be identified from those data.<br />
                    <strong>USAGE DATA</strong> is data collected automatically generated by the use of Service.
                  </p>

                  <h3 className="font-bold text-text-primary text-sm">3. Types of Data Collected</h3>
                  <p>
                    We collect several different types of information to provide and improve our Service to you, including:
                  </p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Email address</li>
                    <li>First name and last name</li>
                    <li>Phone number</li>
                    <li>Address, State, City, ZIP code</li>
                    <li>Cookies and Location Data</li>
                  </ul>

                  <h3 className="font-bold text-text-primary text-sm">4. Use of Data</h3>
                  <p>
                    {supportConfig.company_name} uses the collected data to provide and maintain our Service, notify you about changes, provide customer support, monitor usage, detect technical issues, and enforce our contracts.
                  </p>

                  <h3 className="font-bold text-text-primary text-sm">5. Governing Law</h3>
                  <p>
                    This policy is aligned with Ghanaian Data Protection regulations (DPA 2012) and maintains compliance with GDPR policies where applicable.
                  </p>

                  <h3 className="font-bold text-text-primary text-sm">6. Contact Us</h3>
                  <p>
                    If you have any questions about this Privacy Policy, please contact us by email: <strong>{supportConfig.support_email}</strong>.
                  </p>
                </div>
              </div>
            )}

            {/* COOKIE POLICY TAB */}
            {currentTab === 'cookie_policy' && (
              <div className="space-y-6 animate-fade-in text-text-secondary text-xs leading-relaxed">
                <div className="flex items-center gap-3 mb-4 border-b pb-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-primary flex-shrink-0">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-text-primary">Cookie Policy</h2>
                    <p className="text-[10px] text-text-muted">Last updated: {supportConfig.last_updated}</p>
                  </div>
                </div>

                <div className="space-y-4 text-xs">
                  <p>
                    This Cookie Policy explains how {supportConfig.company_name} uses cookies and similar technologies to recognize you when you visit our website. It explains what these technologies are and why we use them, as well as your rights to control our use of them.
                  </p>

                  <h3 className="font-bold text-text-primary text-sm">What are cookies?</h3>
                  <p>
                    Cookies are small data files that are placed on your computer or mobile device when you visit a website. Cookies are widely used by website owners in order to make their websites work, or to work more efficiently, as well as to provide reporting information.
                  </p>

                  <h3 className="font-bold text-text-primary text-sm">Why do we use cookies?</h3>
                  <p>
                    We use first-party and third-party cookies for several reasons. Some cookies are required for technical reasons in order for our Website to operate, and we refer to these as "essential" or "strictly necessary" cookies. Other cookies also enable us to track and target the interests of our users to enhance the experience on our Online Services.
                  </p>

                  <h3 className="font-bold text-text-primary text-sm">Types of Cookies we use</h3>
                  <ul className="list-disc pl-4 space-y-1.5">
                    <li><strong>Session Cookies:</strong> Temporarily stored during browser session to maintain authentication.</li>
                    <li><strong>Preference Cookies:</strong> Used to remember your dashboard filters and category choices.</li>
                    <li><strong>Security Cookies:</strong> Help identify potential CSRF threats or malicious logins.</li>
                  </ul>

                  <h3 className="font-bold text-text-primary text-sm">How can I control cookies?</h3>
                  <p>
                    You have the right to decide whether to accept or reject cookies. You can set or amend your web browser controls to accept or refuse cookies. If you choose to reject cookies, you may still use our website though your access to some functionality and areas of our website may be restricted.
                  </p>
                </div>
              </div>
            )}

            {/* DISPUTE POLICY TAB */}
            {currentTab === 'dispute_policy' && (
              <div className="space-y-6 animate-fade-in text-text-secondary text-xs leading-relaxed">
                <div className="flex items-center gap-3 mb-4 border-b pb-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-primary flex-shrink-0">
                    <HeartHandshake size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-text-primary">Dispute Resolution Policy</h2>
                    <p className="text-[10px] text-text-muted">Effective date: {supportConfig.effective_date}</p>
                  </div>
                </div>

                <div className="space-y-4 text-xs">
                  <p>
                    This Dispute Resolution Policy governs how disagreements regarding service quality, timelines, or financial releases between Clients and Artisans booked through {supportConfig.company_name} are resolved.
                  </p>

                  <h3 className="font-bold text-text-primary text-sm">1. Initial Negotiation</h3>
                  <p>
                    Before lodging a formal dispute, both parties are required to discuss and attempt to resolve the issue directly using the in-app chat. Often, issues stem from minor miscommunications regarding materials or timelines.
                  </p>

                  <h3 className="font-bold text-text-primary text-sm">2. Escrow Mediation</h3>
                  <p>
                    If direct negotiations fail, either party can raise a dispute by emailing <strong>{supportConfig.support_email}</strong> with the booking ID. Once a dispute is opened:
                  </p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>The escrow payment is frozen immediately.</li>
                    <li>Both parties must provide photographic evidence of the work.</li>
                    <li>Our team reviews chat logs, expectations, and evidence.</li>
                  </ul>

                  <h3 className="font-bold text-text-primary text-sm">3. Resolutions</h3>
                  <p>
                    Decisions are rendered within 5 business days and may result in:
                  </p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>**Full Refund**: Released to the client if the artisan failed to start or significantly deviated from the agreed scope.</li>
                    <li>**Split Settlement**: A percentage released to the artisan for completed milestones, and a percentage refunded to the client.</li>
                    <li>**Full Release**: Released to the artisan if evidence shows the work was completed fully in accordance with the contract.</li>
                  </ul>
                </div>
              </div>
            )}

            {/* CANCELLATION POLICY TAB */}
            {currentTab === 'cancellation_policy' && (
              <div className="space-y-6 animate-fade-in text-text-secondary text-xs leading-relaxed">
                <div className="flex items-center gap-3 mb-4 border-b pb-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-primary flex-shrink-0">
                    <XCircle size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-text-primary">Cancellation & Refund Policy</h2>
                    <p className="text-[10px] text-text-muted">Effective date: {supportConfig.effective_date}</p>
                  </div>
                </div>

                <div className="space-y-4 text-xs">
                  <p>
                    This policy outlines the cancellations rules, windows, and refund deductions for both artisans and clients booking services on {supportConfig.company_name}.
                  </p>

                  <h3 className="font-bold text-text-primary text-sm">1. Client Cancellations</h3>
                  <ul className="list-disc pl-4 space-y-1.5">
                    <li>**More than 24 hours before job start**: Full refund of the escrow amount. No cancellation fees.</li>
                    <li>**Within 24 hours of job start**: A fee of 15% of the total budget is deducted to compensate the artisan for loss of other work opportunities, and the rest is refunded to the client.</li>
                    <li>**After artisan has arrived at location**: A fee of 30% or the transport allowance (whichever is higher) is deducted and paid to the artisan.</li>
                  </ul>

                  <h3 className="font-bold text-text-primary text-sm">2. Artisan Cancellations</h3>
                  <p>
                    Artisans who cancel confirmed bookings are subject to penalty points. Repeated cancellations within short windows will lead to:
                  </p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Lowered marketplace search rankings.</li>
                    <li>Temporary verification badge suspension.</li>
                    <li>Removal from the platform for repeated no-shows.</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
