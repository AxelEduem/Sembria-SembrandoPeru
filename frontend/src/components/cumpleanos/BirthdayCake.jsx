import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import EnlargeablePhoto from "@/components/ui/enlargeable-photo";
import { getAvatarUrl } from "@/utils/avatar";
import { getInitials } from "@/utils/cumpleanosUtils";

function BirthdayCake({ row, celebration = false }) {
  const initials = getInitials(row?.nombre);
  const avatarUrl = getAvatarUrl(row?.avatar_url) || getAvatarUrl(row?.avatar_path);

  return (
    <div
      className={`relative mx-auto mt-6 flex h-[210px] w-full max-w-[290px] items-end justify-center ${
        celebration ? "birthday-cake-celebration" : ""
      }`}
    >
      {celebration ? (
        <>
          <div className="birthday-confetti absolute top-7 left-7 text-rose-400">✦</div>

          <div className="birthday-confetti birthday-confetti-delay absolute top-12 right-7 text-amber-400">
            ✦
          </div>

          <div className="birthday-confetti birthday-confetti-delay-2 absolute top-16 left-14 text-emerald-400">
            ✦
          </div>

          <div className="birthday-confetti absolute top-22 right-14 text-rose-300">✦</div>
        </>
      ) : (
        <>
          <div className="absolute top-9 left-7 h-2 w-2 rounded-full bg-rose-200 opacity-80" />
          <div className="absolute top-14 right-10 h-1.5 w-1.5 rounded-full bg-amber-200 opacity-80" />
          <div className="absolute top-20 left-16 h-1.5 w-1.5 rounded-full bg-rose-300 opacity-70" />
          <div className="absolute top-5 right-20 h-2 w-2 rounded-full bg-emerald-200 opacity-80" />
        </>
      )}

      <div className="absolute top-28 left-12 rotate-[-25deg] text-rose-300">✦</div>
      <div className="absolute top-32 right-9 rotate-[20deg] text-amber-300">✦</div>

      <div className="absolute bottom-[145px] left-1/2 z-30 -translate-x-1/2">
        <div className="relative flex flex-col items-center">
          <div className="birthday-flame relative mb-1 h-7 w-4">
            <div className="absolute top-0 left-1/2 h-5 w-3 -translate-x-1/2 rotate-[8deg] rounded-[70%_35%_65%_35%] bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.65)]" />
            <div className="absolute top-1 left-1/2 h-3.5 w-2 -translate-x-1/2 rotate-[8deg] rounded-[70%_35%_65%_35%] bg-white" />
          </div>

          <div className="relative h-14 w-3.5 overflow-hidden rounded-full border border-rose-200 bg-white shadow-sm">
            <div className="absolute inset-0 bg-[repeating-linear-gradient(-45deg,transparent_0px,transparent_5px,#fda4af_5px,#fda4af_8px)]" />
          </div>
        </div>
      </div>

      <div className="relative z-20 w-[245px]">
        <div className="relative h-[65px] rounded-[24px_24px_15px_15px] border border-rose-200 bg-gradient-to-b from-rose-100 via-rose-50 to-white shadow-[0_12px_20px_rgba(244,63,94,0.10)]">
          <div className="absolute -top-3 right-0 left-0 h-7">
            <div className="absolute inset-x-0 top-1 h-5 rounded-full bg-gradient-to-b from-rose-200 to-rose-100" />
            <div className="absolute top-3 left-3 h-7 w-7 rounded-full bg-rose-100" />
            <div className="absolute top-4 left-9 h-8 w-8 rounded-full bg-rose-100" />
            <div className="absolute top-3 left-16 h-7 w-7 rounded-full bg-rose-100" />
            <div className="absolute top-4 left-[92px] h-8 w-8 rounded-full bg-rose-100" />
            <div className="absolute top-3 left-[130px] h-7 w-7 rounded-full bg-rose-100" />
            <div className="absolute top-4 left-[160px] h-8 w-8 rounded-full bg-rose-100" />
            <div className="absolute top-3 left-[198px] h-7 w-7 rounded-full bg-rose-100" />
          </div>

          <div className="absolute top-6 left-5 h-2 w-2 rounded-full bg-rose-300" />
          <div className="absolute top-8 left-12 h-1.5 w-1.5 rounded-full bg-amber-300" />
          <div className="absolute top-7 right-12 h-2 w-2 rounded-full bg-emerald-300" />
          <div className="absolute top-5 right-5 h-1.5 w-1.5 rounded-full bg-rose-300" />

          {avatarUrl ? (
            <EnlargeablePhoto
              src={avatarUrl}
              fallbackSrc={getAvatarUrl(row?.avatar_path)}
              alt={`Foto de ${row?.nombre || "integrante"}`}
              className="absolute top-1/2 left-1/2 h-12 w-12 -translate-x-1/2 -translate-y-[42%] rounded-2xl border border-white/80 bg-white/80 shadow-sm backdrop-blur-sm"
            />
          ) : (
            <Avatar className="absolute top-1/2 left-1/2 h-12 w-12 -translate-x-1/2 -translate-y-[42%] rounded-2xl border border-white/80 bg-white/80 shadow-sm backdrop-blur-sm">
              <AvatarFallback className="rounded-2xl bg-white/80 text-sm font-bold text-rose-600">
                {initials}
              </AvatarFallback>
            </Avatar>
          )}
        </div>

        <div className="relative -mt-1 h-[55px] rounded-[10px_10px_17px_17px] border-x border-b border-rose-200 bg-gradient-to-b from-rose-300 via-rose-200 to-rose-100 shadow-[0_8px_14px_rgba(244,63,94,0.10)]">
          <div className="absolute inset-x-4 top-2 h-px bg-white/70" />
          <div className="absolute top-5 left-8 h-2 w-2 rounded-full bg-white/70" />
          <div className="absolute top-6 left-20 h-1.5 w-1.5 rounded-full bg-white/80" />
          <div className="absolute top-5 right-20 h-2 w-2 rounded-full bg-white/70" />
          <div className="absolute top-6 right-8 h-1.5 w-1.5 rounded-full bg-white/80" />
        </div>

        <div className="relative -mt-1 h-5 rounded-[5px_5px_13px_13px] border border-rose-300 bg-rose-400 shadow-[0_7px_12px_rgba(244,63,94,0.12)]">
          <div className="absolute inset-x-5 top-1 h-1 rounded-full bg-white/30" />
        </div>

        <div className="absolute -bottom-7 left-1/2 h-6 w-[220px] -translate-x-1/2 rounded-[50%] bg-slate-900/10 blur-md" />
      </div>
    </div>
  );
}

export default BirthdayCake;
