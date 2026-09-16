import Link from "next/link";
import { Lock, MessageCircle, Moon, Search, Share2, Upload, Users } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { AmbientBackground } from "@/components/motion/ambient-background";
import { Reveal } from "@/components/motion/reveal";
import { DashboardPreview } from "@/components/site/dashboard-preview";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { shellWidth } from "@/components/site/shell";

const steps = [
  {
    step: "1",
    title: "Create your account",
    body: "Sign up with your work email. You start with a Private library that only you can see.",
  },
  {
    step: "2",
    title: "Add files to a team",
    body: "Upload a PDF or text file to Private or any team you belong to. You’ll see when it’s ready.",
  },
  {
    step: "3",
    title: "Share with the right people",
    body: "If you own a file, share it with one or more teams you belong to — or unshare it from several at once. Last copies return to Private.",
  },
  {
    step: "4",
    title: "Ask in chat",
    body: "Pick a team, ask in everyday language, and get an answer drawn from that team’s files.",
  },
];

const features = [
  {
    title: "Private library",
    body: "Keep personal files in Private. They stay with you until you share them.",
    icon: Lock,
  },
  {
    title: "Teams and members",
    body: "Create a team, invite people by email, and transfer ownership to another member when you need to.",
    icon: Users,
  },
  {
    title: "Share and unshare",
    body: "File owners can share with several teams they belong to, and remove a file from more than one team at a time.",
    icon: Share2,
  },
  {
    title: "Team chat",
    body: "Ask a question against one team at a time, so answers come from the files that group can see.",
    icon: MessageCircle,
  },
  {
    title: "Find files fast",
    body: "Search a team’s files by name. Retry or delete anything you uploaded.",
    icon: Search,
  },
  {
    title: "Your account",
    body: "Update your name and email, switch between day and night view, or sign out from your profile.",
    icon: Moon,
  },
];

export default function Home() {
  return (
    <div className="relative flex min-h-full flex-1 flex-col bg-background">
      <AmbientBackground />
      <div className="relative z-10 flex min-h-full flex-1 flex-col">
        <SiteHeader />

        <main className="flex-1">
          <section className="relative overflow-hidden">
            <div className={`grid items-center gap-10 py-16 sm:py-20 lg:grid-cols-[minmax(0,1.05fr)_minmax(18rem,28rem)] xl:grid-cols-[minmax(0,1fr)_minmax(22rem,32rem)] lg:gap-12 ${shellWidth}`}>
              <div className="max-w-xl">
                <p className="animate-fade-up text-xs font-medium tracking-wide text-primary uppercase">
                  Private library · Teams · Chat
                </p>
                <h1 className="animate-fade-up animate-delay-1 mt-3 text-4xl font-semibold tracking-tight sm:text-5xl lg:text-[3.25rem] lg:leading-[1.1]">
                  Find answers in the documents your team already has.
                </h1>
                <p className="animate-fade-up animate-delay-2 mt-5 max-w-xl text-base leading-7 text-muted-foreground">
                  Upload policies, reports, and notes. Keep them private, share them with a team you
                  belong to, and ask a question in plain language — without digging through folders.
                </p>
                <div className="animate-fade-up animate-delay-3 mt-8 flex flex-wrap gap-3">
                  <Link href="/register" className={`${buttonVariants({ size: "lg" })} transition-transform hover:-translate-y-0.5`}>
                    Get started
                  </Link>
                  <Link
                    href="/login"
                    className={`${buttonVariants({ variant: "outline", size: "lg" })} bg-card transition-transform hover:-translate-y-0.5`}
                  >
                    Sign in
                  </Link>
                </div>
                <dl className="animate-fade-up animate-delay-4 mt-10 grid max-w-lg grid-cols-3 gap-4 text-sm">
                  <div>
                    <dt className="text-muted-foreground">Library</dt>
                    <dd className="mt-1 font-medium">Your uploads</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Teams</dt>
                    <dd className="mt-1 font-medium">Share on purpose</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Chat</dt>
                    <dd className="mt-1 font-medium">Ask one team</dd>
                  </div>
                </dl>
              </div>

              <div className="animate-fade-up animate-delay-3 min-w-0">
                <DashboardPreview />
              </div>
            </div>
          </section>

          <section id="how-it-works" className="border-y border-border/80 bg-card">
            <div className={`py-16 sm:py-20 ${shellWidth}`}>
              <Reveal>
                <p className="text-xs font-medium tracking-wide text-primary uppercase">How it works</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight">From upload to answer</h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
                  Four steps. You stay in control of who can see each file.
                </p>
              </Reveal>
              <ol className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                {steps.map((item, index) => (
                  <Reveal
                    key={item.step}
                    as="li"
                    delay={(index + 1) as 1 | 2 | 3 | 4}
                    className="hover-lift rounded-2xl border border-border/80 bg-background p-6"
                  >
                    <p className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                      {item.step}
                    </p>
                    <h3 className="mt-4 font-medium">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.body}</p>
                  </Reveal>
                ))}
              </ol>
            </div>
          </section>

          <section id="features" className={`py-16 sm:py-20 ${shellWidth}`}>
            <Reveal>
              <p className="text-xs font-medium tracking-wide text-primary uppercase">Features</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight">What you can do</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
                Everything you need to keep files close, share them with a team, and ask questions
                you can trust.
              </p>
            </Reveal>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {features.map((item, index) => (
                <Reveal
                  key={item.title}
                  as="article"
                  delay={((index % 4) + 1) as 1 | 2 | 3 | 4}
                  className="group hover-lift rounded-2xl border border-border/80 bg-card p-6 shadow-sm"
                >
                  <span className="flex size-12 items-center justify-center rounded-xl bg-accent text-primary transition-transform duration-300 group-hover:scale-105">
                    <item.icon className="size-6" />
                  </span>
                  <h3 className="mt-4 font-medium">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.body}</p>
                </Reveal>
              ))}
            </div>
          </section>

          <section className="border-y border-border/80 bg-card">
            <div className={`grid items-center gap-10 py-16 sm:py-20 lg:grid-cols-2 ${shellWidth}`}>
              <Reveal>
                <p className="text-xs font-medium tracking-wide text-primary uppercase">Sharing</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight">Share on purpose, not by default.</h2>
                <p className="mt-4 max-w-xl text-sm leading-7 text-muted-foreground">
                  New files live with the team you upload them to. If you own a file, you can share
                  it with several teams you belong to, or take it back from more than one team at
                  once. If it was only on those teams, Folio moves it to your Private library so
                  nothing is lost.
                </p>
                <ul className="mt-6 space-y-3 text-sm leading-6 text-muted-foreground">
                  <li className="flex gap-3">
                    <Upload className="mt-0.5 size-4 shrink-0 text-primary" />
                    Upload to Private or a team you are in.
                  </li>
                  <li className="flex gap-3">
                    <Share2 className="mt-0.5 size-4 shrink-0 text-primary" />
                    Owners share and unshare with one or more teams they belong to.
                  </li>
                  <li className="flex gap-3">
                    <Lock className="mt-0.5 size-4 shrink-0 text-primary" />
                    Private stays yours — it is never a share target.
                  </li>
                </ul>
              </Reveal>
              <Reveal delay={2} className="rounded-3xl border border-border/80 bg-background p-6 shadow-sm">
                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Share with teams</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {["Engineering", "Finance", "People Ops"].map((name) => (
                    <span key={name} className="rounded-full border border-border/80 bg-card px-3 py-1.5 text-sm">
                      {name}
                    </span>
                  ))}
                </div>
                <p className="mt-5 text-xs font-medium tracking-wide text-muted-foreground uppercase">Unshare</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Remove from People Ops. If this is the last team the file is on, it returns to your
                  Private library.
                </p>
              </Reveal>
            </div>
          </section>

          <section id="about" className={`py-16 sm:py-20 ${shellWidth}`}>
            <Reveal>
              <p className="text-xs font-medium tracking-wide text-primary uppercase">About</p>
              <h2 className="mt-2 max-w-2xl text-3xl font-semibold tracking-tight">
                Built for the documents you already work with.
              </h2>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground">
                Folio helps people get useful answers from policies, notes, and reports — without a
                shared-drive scavenger hunt. You keep a private library, form teams for the work that
                is shared, and ask questions in your own words. Files belong to the people who
                uploaded them. Teams only see what has been shared with them.
              </p>
            </Reveal>
          </section>

          <section id="contact" className="border-t border-border/80 bg-card">
            <div className={`flex flex-col gap-6 py-16 sm:flex-row sm:items-end sm:justify-between sm:py-20 ${shellWidth}`}>
              <Reveal>
                <h2 className="text-3xl font-semibold tracking-tight">Ready when you are</h2>
                <p className="mt-3 max-w-xl text-sm leading-7 text-muted-foreground">
                  Need help getting started, or want Folio for your team? Write to{" "}
                  <a href="mailto:hello@eike.app" className="font-medium text-primary underline-offset-4 hover:underline">
                    hello@eike.app
                  </a>
                  . We usually reply within one business day.
                </p>
              </Reveal>
              <Reveal delay={2} className="flex flex-wrap gap-3">
                <Link href="/register" className={`${buttonVariants({ size: "lg" })} transition-transform hover:-translate-y-0.5`}>
                  Create an account
                </Link>
                <Link
                  href="/login"
                  className={`${buttonVariants({ variant: "outline", size: "lg" })} bg-background transition-transform hover:-translate-y-0.5`}
                >
                  Sign in
                </Link>
              </Reveal>
            </div>
          </section>
        </main>

        <SiteFooter />
      </div>
    </div>
  );
}
