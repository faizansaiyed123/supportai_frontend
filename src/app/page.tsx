"import Link from \"next/link\";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  BrainCircuit,
  Check,
  FileText,
  MessageCircle,
  MessagesSquare,
  ShieldCheck,
  Sparkles,
  Ticket,
  Users,
  Workflow,
} from \"lucide-react\";

const features = [
  {
    icon: BookOpen,
    eyebrow: \"KNOWLEDGE HUB\",
    title: \"Bring your knowledge together\",
    description:
      \"Upload support documents or add a URL so your team has a clear place to build answers from.\",
  },
  {
    icon: BrainCircuit,
    eyebrow: \"AI-ASSISTED ANSWERS\",
    title: \"Answers with their sources\",
    description:
      \"Help agents respond using your indexed knowledge, with source citations and a low-confidence signal when an answer needs care.\",
  },
  {
    icon: MessagesSquare,
    eyebrow: \"CONVERSATION WORKSPACE\",
    title: \"Keep the whole conversation in view\",
    description:
      \"Create and review support conversations, follow messages, and escalate cases when a person needs to step in.\",
  },
  {
    icon: Ticket,
    eyebrow: \"TICKET FOLLOW-THROUGH\",
    title: \"Turn issues into trackable work\",
    description:
      \"Create tickets, assign ownership, set status and priority, and keep useful notes alongside the issue.\",
  },
];

const workflow = [
  {
    number: \"01\",
    title: \"Connect your knowledge\",
    description: \"Start with the guides and documentation your team already trusts.\",
    icon: FileText,
  },
  {
    number: \"02\",
    title: \"Find a grounded answer\",
    description: \"Use AI-assisted responses with citations that help your team check the context.\",
    icon: Sparkles,
  },
  {
    number: \"03\",
    title: \"Resolve with your team\",
    description: \"Continue the conversation, escalate when needed, and track follow-up in tickets.\",
    icon: Workflow,
  },
];

function BrandMark({ small = false }: { small?: boolean }) {
  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm shadow-brand-600/20 ${small ? \"h-9 w-9\" : \"h-11 w-11\"}`}
      aria-hidden=\"true\"
    >
      <MessageCircle className={small ? \"h-[18px] w-[18px]\" : \"h-5 w-5\"} strokeWidth={2.2} />
      <span className=\"absolute right-[7px] top-[7px] h-1.5 w-1.5 rounded-full bg-sky-200\" />
    </span>
  );
}

export default function HomePage() {
  return (
    <main className=\"relative isolate min-h-screen overflow-hidden bg-neutral-50 text-neutral-900\">
      <div
        aria-hidden=\"true\"
        className=\"pointer-events-none absolute inset-x-0 top-0 -z-10 h-[760px] bg-gradient-to-b from-white via-brand-50/50 to-neutral-50\"
      />
      <div
        aria-hidden=\"true\"
        className=\"pointer-events-none absolute -right-32 top-24 -z-10 h-96 w-96 rounded-full bg-brand-200/30 blur-3xl\"
      />
      <div
        aria-hidden=\"true\"
        className=\"pointer-events-none absolute -left-36 top-[430px] -z-10 h-80 w-80 rounded-full bg-sky-100/70 blur-3xl\"
      />

      <a
        href=\"#main-content\"
        className=\"sr-only z-50 rounded-md bg-white px-4 py-2 text-sm font-medium text-brand-700 focus:not-sr-only focus:fixed focus:left-4 focus:top-4\"
      >
        Skip to content
      </a>

      <header className=\"sticky top-0 z-40 border-b border-neutral-200/80 bg-white/85 backdrop-blur-xl\">
        <div className=\"mx-auto flex h-[76px] max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10\">
          <Link href=\"/\" className=\"group inline-flex items-center gap-3\" aria-label=\"SupportAI home\">
            <BrandMark />
            <span className=\"flex flex-col leading-tight\">
              <span className=\"text-[17px] font-bold tracking-tight text-neutral-950\">SupportAI</span>
              <span className=\"mt-1 hidden text-[9px] font-semibold tracking-[0.19em] text-neutral-500 sm:block\">
                CUSTOMER SUPPORT WORKSPACE
              </span>
            </span>
          </Link>

          <nav aria-label=\"Main navigation\" className=\"hidden items-center gap-8 md:flex\">
            <a href=\"#platform\" className=\"text-sm font-medium text-neutral-600 transition hover:text-brand-700\">
              Platform
            </a>
            <a href=\"#workflow\" className=\"text-sm font-medium text-neutral-600 transition hover:text-brand-700\">
              How it works
            </a>
            <a href=\"#teams\" className=\"text-sm font-medium text-neutral-600 transition hover:text-brand-700\">
              For support teams
            </a>
          </nav>

          <div className=\"flex items-center gap-2 sm:gap-3\">
            <Link
              href=\"/login\"
              className=\"hidden rounded-lg px-3 py-2.5 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-100 hover:text-neutral-950 sm:inline-flex\"
            >
              Sign in
            </Link>
            <Link
              href=\"/register\"
              className=\"inline-flex items-center gap-2 rounded-lg bg-brand-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-brand-600/20 transition hover:bg-brand-700 focus-visible:outline-offset-4 sm:px-4\"
            >
              Create workspace
              <ArrowUpRight className=\"h-4 w-4\" aria-hidden=\"true\" />
            </Link>
          </div>
        </div>
      </header>

      <section id=\"main-content\" className=\"mx-auto grid max-w-7xl items-center gap-14 px-5 pb-20 pt-14 sm:px-8 sm:pt-20 lg:grid-cols-[0.94fr_1.06fr] lg:gap-12 lg:px-10 lg:pb-28 lg:pt-24\">
        <div className=\"max-w-2xl\">
          <div className=\"inline-flex items-center gap-2 rounded-full border border-brand-100 bg-white/90 px-3.5 py-2 text-[11px] font-bold tracking-[0.13em] text-brand-700 shadow-sm shadow-brand-900/[0.03]\">
            <Sparkles className=\"h-3.5 w-3.5\" aria-hidden=\"true\" />
            AI-ASSISTED CUSTOMER SUPPORT
          </div>

          <h1 className=\"mt-7 max-w-2xl text-4xl font-semibold leading-[1.08] tracking-[-0.045em] text-neutral-950 sm:text-5xl lg:text-[3.65rem]\">
            Support that starts with what your team{" \"}
            <span className=\"relative whitespace-nowrap text-brand-600\">
              knows.
              <span aria-hidden=\"true\" className=\"absolute -bottom-1 left-0 h-2 w-full rounded-full bg-brand-200/60\" />
            </span>
          </h1>

          <p className=\"mt-6 max-w-xl text-base leading-8 text-neutral-600 sm:text-lg\">
            Turn your support knowledge into useful, source-backed answers. Keep conversations organized,
            bring people in when they are needed, and track the issues that need follow-through.
          </p>

          <div className=\"mt-8 flex flex-col gap-3 sm:flex-row sm:items-center\">
            <Link
              href=\"/register\"
              className=\"inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-600/20 transition hover:-translate-y-0.5 hover:bg-brand-700\"
            >
              Get started
              <ArrowRight className=\"h-4 w-4\" aria-hidden=\"true\" />
            </Link>
            <Link
              href=\"/login\"
              className=\"inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-5 py-3 text-sm font-semibold text-neutral-700 shadow-sm transition hover:border-brand-200 hover:bg-brand-50/50 hover:text-brand-700\"
            >
              Sign in to your workspace
            </Link>
          </div>

          <div className=\"mt-8 flex flex-wrap gap-x-5 gap-y-3 border-t border-neutral-200/80 pt-6 text-sm text-neutral-600\">
            <span className=\"inline-flex items-center gap-2\">
              <Check className=\"h-4 w-4 text-brand-600\" aria-hidden=\"true\" />
              Knowledge-backed answers
            </span>
            <span className=\"inline-flex items-center gap-2\">
              <Check className=\"h-4 w-4 text-brand-600\" aria-hidden=\"true\" />
              Human handoff
            </span>
            <span className=\"inline-flex items-center gap-2\">
              <Check className=\"h-4 w-4 text-brand-600\" aria-hidden=\"true\" />
              Ticket tracking
            </span>
          </div>
        </div>

        <div className=\"relative mx-auto w-full max-w-[590px] lg:ml-auto\">
          <div aria-hidden=\"true\" className=\"absolute -inset-5 rounded-[2rem] bg-gradient-to-br from-brand-200/40 via-white/20 to-sky-200/40 blur-xl\" />
          <div className=\"relative overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-2xl shadow-neutral-900/[0.09] sm:rounded-3xl\">
            <div className=\"flex items-center justify-between gap-4 border-b border-neutral-100 px-5 py-4 sm:px-6\">
              <div className=\"flex min-w-0 items-center gap-3\">
                <BrandMark small />
                <div className=\"min-w-0\">
                  <p className=\"truncate text-sm font-semibold text-neutral-900\">SupportAI assistant</p>
                  <p className=\"mt-0.5 text-xs text-neutral-500\">Knowledge-powered support</p>
                </div>
              </div>
              <span className=\"inline-flex shrink-0 items-center gap-1.5 rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-500\">
                <span className=\"h-1.5 w-1.5 rounded-full bg-brand-500\" />
                Example preview
              </span>
            </div>

            <div className=\"space-y-5 bg-gradient-to-b from-white to-neutral-50/80 p-5 sm:p-6\">
              <div className=\"flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-400\">
                <span className=\"h-px flex-1 bg-neutral-200\" />
                Example support conversation
                <span className=\"h-px flex-1 bg-neutral-200\" />
              </div>

              <div className=\"ml-auto max-w-[88%] rounded-2xl rounded-br-md border border-neutral-200 bg-white px-4 py-3.5 shadow-sm\">
                <p className=\"text-[10px] font-semibold uppercase tracking-wider text-neutral-400\">Customer question</p>
                <p className=\"mt-1.5 text-sm leading-6 text-neutral-700\">
                  What should I try when I can’t access my account?
                </p>
              </div>

              <div className=\"flex items-start gap-3\">
                <span className=\"mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700\">
                  <BrainCircuit className=\"h-4.5 w-4.5\" aria-hidden=\"true\" />
                </span>
                <div className=\"min-w-0 flex-1 rounded-2xl rounded-tl-md border border-brand-100 bg-white p-4 shadow-sm sm:p-5\">
                  <div className=\"flex flex-wrap items-center justify-between gap-2\">
                    <p className=\"text-sm font-semibold text-neutral-900\">Suggested answer</p>
                    <span className=\"inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-1 text-[10px] font-semibold text-brand-700\">
                      <Sparkles className=\"h-3 w-3\" aria-hidden=\"true\" />
                      AI-assisted
                    </span>
                  </div>
                  <p className=\"mt-3 text-sm leading-6 text-neutral-600\">
                    Start with the account recovery steps in your help guide. If the issue continues,
                    check the customer’s details and pass the case to a support agent for follow-up.
                  </p>
                  <div className=\"mt-4 border-t border-neutral-100 pt-3\">
                    <p className=\"mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.13em] text-neutral-500\">
                      <BookOpen className=\"h-3.5 w-3.5\" aria-hidden=\"true\" />
                      Example source references
                    </p>
                    <div className=\"flex flex-wrap gap-2\">
                      <span className=\"inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 text-[11px] font-medium text-neutral-600\">
                        <FileText className=\"h-3 w-3 text-brand-600\" aria-hidden=\"true\" />
                        Account recovery guide
                      </span>
                      <span className=\"inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 text-[11px] font-medium text-neutral-600\">
                        <FileText className=\"h-3 w-3 text-brand-600\" aria-hidden=\"true\" />
                        Support handoff notes
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className=\"flex items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3\">
                <div className=\"flex items-center gap-3\">
                  <span className=\"flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-700\">
                    <Users className=\"h-4 w-4\" aria-hidden=\"true\" />
                  </span>
                  <div>
                    <p className=\"text-xs font-semibold text-neutral-800\">Human handoff when needed</p>
                    <p className=\"mt-0.5 text-[11px] text-neutral-500\">Continue into a conversation or ticket</p>
                  </div>
                </div>
                <ArrowUpRight className=\"h-4 w-4 shrink-0 text-neutral-400\" aria-hidden=\"true\" />
              </div>
            </div>
            <div className=\"flex items-center justify-center gap-2 border-t border-neutral-100 bg-white px-4 py-3 text-[10px] font-medium text-neutral-400\">
              <ShieldCheck className=\"h-3.5 w-3.5\" aria-hidden=\"true\" />
              Illustrative content · Not connected to a live backend
            </div>
          </div>

          <div className=\"absolute -bottom-5 -left-3 hidden items-center gap-3 rounded-2xl border border-neutral-200 bg-white px-4 py-3.5 shadow-xl shadow-neutral-900/[0.08] sm:flex lg:-left-8\">
            <span className=\"flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700\">
              <Check className=\"h-5 w-5\" aria-hidden=\"true\" />
            </span>
            <span>
              <span className=\"block text-xs font-semibold text-neutral-900\">Context included</span>
              <span className=\"mt-1 block text-[11px] text-neutral-500\">Sources stay in view</span>
            </span>
          </div>
        </div>
      </section>

      <section id=\"platform\" className=\"border-y border-neutral-200/80 bg-white py-20 sm:py-24\">
        <div className=\"mx-auto max-w-7xl px-5 sm:px-8 lg:px-10\">
          <div className=\"mx-auto max-w-2xl text-center\">
            <p className=\"text-xs font-bold tracking-[0.18em] text-brand-700\">THE SUPPORTAI WORKSPACE</p>
            <h2 className=\"mt-4 text-3xl font-semibold tracking-[-0.035em] text-neutral-950 sm:text-4xl\">
              One place for knowledge, answers, and follow-through.
            </h2>
            <p className=\"mt-4 text-base leading-7 text-neutral-600\">
              SupportAI connects the information your team uses with the work that moves each support
              issue forward.
            </p>
          </div>

          <div className=\"mt-12 grid gap-4 sm:grid-cols-2 xl:mt-14 xl:grid-cols-4\">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <article
                  key={feature.eyebrow}
                  className=\"group rounded-2xl border border-neutral-200 bg-neutral-50/65 p-6 transition duration-200 hover:-translate-y-1 hover:border-brand-200 hover:bg-white hover:shadow-lg hover:shadow-brand-900/[0.05]\"
                >
                  <div className=\"flex items-center justify-between\">
                    <span className=\"flex h-11 w-11 items-center justify-center rounded-xl border border-brand-100 bg-white text-brand-700 shadow-sm\">
                      <Icon className=\"h-5 w-5\" aria-hidden=\"true\" />
                    </span>
                    <span className=\"font-mono text-xs text-neutral-300\">0{index + 1}</span>
                  </div>
                  <p className=\"mt-6 text-[9px] font-bold tracking-[0.15em] text-brand-700\">{feature.eyebrow}</p>
                  <h3 className=\"mt-2 text-lg font-semibold leading-6 tracking-tight text-neutral-900\">{feature.title}</h3>
                  <p className=\"mt-3 text-sm leading-6 text-neutral-600\">{feature.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id=\"workflow\" className=\"relative overflow-hidden py-20 sm:py-24\">
        <div aria-hidden=\"true\" className=\"pointer-events-none absolute -right-24 top-10 h-72 w-72 rounded-full bg-brand-100/70 blur-3xl\" />
        <div className=\"relative mx-auto max-w-7xl px-5 sm:px-8 lg:px-10\">
          <div className=\"grid gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:gap-16\">
            <div className=\"max-w-lg\">
              <p className=\"text-xs font-bold tracking-[0.18em] text-brand-700\">FROM QUESTION TO RESOLUTION</p>
              <h2 className=\"mt-4 text-3xl font-semibold tracking-[-0.035em] text-neutral-950 sm:text-4xl\">
                A clearer path through support.
              </h2>
              <p className=\"mt-4 text-base leading-7 text-neutral-600\">
                Help your team find useful context, respond with confidence, and keep ownership clear
                when an issue needs more attention.
              </p>
              <Link
                href=\"/register\"
                className=\"mt-7 inline-flex items-center gap-2 text-sm font-semibold text-brand-700 transition hover:gap-3 hover:text-brand-800\"
              >
                Explore SupportAI
                <ArrowRight className=\"h-4 w-4\" aria-hidden=\"true\" />
              </Link>
            </div>

            <div className=\"divide-y divide-neutral-200 rounded-2xl border border-neutral-200 bg-white px-5 shadow-sm sm:px-7\">
              {workflow.map((step) => {
                const Icon = step.icon;
                return (
                  <div key={step.number} className=\"flex gap-4 py-6 sm:gap-5 sm:py-7\">
                    <span className=\"flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700\">
                      <Icon className=\"h-5 w-5\" aria-hidden=\"true\" />
                    </span>
                    <div className=\"flex-1\">
                      <p className=\"text-[10px] font-bold tracking-[0.16em] text-neutral-400\">STEP {step.number}</p>
                      <h3 className=\"mt-1 text-base font-semibold text-neutral-900\">{step.title}</h3>
                      <p className=\"mt-2 text-sm leading-6 text-neutral-600\">{step.description}</p>
                    </div>
                    <span className=\"hidden h-7 w-7 shrink-0 items-center justify-center rounded-full border border-neutral-200 text-neutral-400 sm:flex\">
                      <Check className=\"h-3.5 w-3.5\" aria-hidden=\"true\" />
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section id=\"teams\" className=\"px-5 pb-20 sm:px-8 sm:pb-24 lg:px-10\">
        <div className=\"relative mx-auto max-w-7xl overflow-hidden rounded-3xl bg-neutral-950 px-6 py-10 text-white sm:px-10 sm:py-12 lg:px-14 lg:py-14\">
          <div aria-hidden=\"true\" className=\"pointer-events-none absolute -right-12 -top-28 h-80 w-80 rounded-full bg-brand-600/35 blur-3xl\" />
          <div aria-hidden=\"true\" className=\"pointer-events-none absolute bottom-[-170px] left-[30%] h-72 w-72 rounded-full bg-sky-500/15 blur-3xl\" />
          <div className=\"relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between\">
            <div className=\"max-w-2xl\">
              <div className=\"inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[10px] font-bold tracking-[0.14em] text-brand-200\">
                <ShieldCheck className=\"h-3.5 w-3.5\" aria-hidden=\"true\" />
                BUILT FOR TEAM WORKFLOWS
              </div>
              <h2 className=\"mt-4 text-3xl font-semibold leading-tight tracking-[-0.035em] sm:text-4xl\">
                Keep the knowledge close. Keep the next step clear.
              </h2>
              <p className=\"mt-4 max-w-xl text-sm leading-7 text-neutral-300 sm:text-base\">
                Organization-aware access, knowledge management, conversations, and tickets come together
                in one support workspace.
              </p>
            </div>
            <div className=\"relative flex shrink-0 flex-col gap-3 sm:flex-row lg:flex-col\">
              <Link
                href=\"/register\"
                className=\"inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-neutral-950 transition hover:bg-brand-50\"
              >
                Create a workspace
                <ArrowUpRight className=\"h-4 w-4\" aria-hidden=\"true\" />
              </Link>
              <Link
                href=\"/login\"
                className=\"inline-flex min-h-12 items-center justify-center rounded-xl border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10\"
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className=\"border-t border-neutral-200 bg-white\">
        <div className=\"mx-auto flex max-w-7xl flex-col gap-4 px-5 py-7 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10\">
          <Link href=\"/\" className=\"inline-flex w-fit items-center gap-2.5\" aria-label=\"SupportAI home\">
            <BrandMark small />
            <span className=\"text-sm font-semibold text-neutral-800\">SupportAI</span>
          </Link>
          <p className=\"text-xs leading-5 text-neutral-500\">
            AI-assisted answers, a shared knowledge base, and support work your team can follow through.
          </p>
          <div className=\"flex items-center gap-4 text-xs font-medium text-neutral-500\">
            <Link href=\"/login\" className=\"transition hover:text-brand-700\">Sign in</Link>
            <Link href=\"/register\" className=\"transition hover:text-brand-700\">Create workspace</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
