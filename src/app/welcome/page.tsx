import { redirect } from "next/navigation";
import { requireOwner } from "@/lib/auth";
import { reachOn } from "@/lib/phone";
import { Steps } from "@/components/app/Steps";
import { ProfileForm } from "./ProfileForm";

export default async function Page() {
  const user = await requireOwner({ allowOnboarding: true });
  /* Onboarded and reachable: nothing to do here. Onboarded without a
     number (an account from before numbers were required) stays, to
     give one. */
  if (user.onboardedAt && reachOn(user)) redirect("/app");

  return (
    <>
      <Steps at={1} />
      <h1 className="serif mt-8 text-[clamp(2rem,4vw,2.7rem)] leading-[1.05] tracking-[-0.035em]">
        Welcome. Let&rsquo;s set this up properly.
      </h1>
      <p className="t-lede mt-3 max-w-[52ch] text-text-2">
        Three short steps. Your name goes on every report, and we need somewhere to send them when you are asleep in another timezone.
      </p>
      <div className="mt-8"><ProfileForm phone={reachOn(user)} name={user.name} email={user.email} livesIn={user.livesIn} signedInAs={user.googleSub ? user.email : ""} /></div>
    </>
  );
}
