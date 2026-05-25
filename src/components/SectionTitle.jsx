import React from "react";

export default function SectionTitle({
  eyebrow = "Section",
  title = "섹션 제목",
  description = "",
  align = "left"
}) {
  const alignmentClass = align === "center" ? "text-center items-center" : "text-left";

  return (
    <div className={`flex flex-col gap-2 ${alignmentClass}`}>
      <p className="text-sm font-black tracking-[0.18em] text-orange-600">
        {eyebrow}
      </p>
      <h3 className="text-3xl font-black text-stone-900">
        {title}
      </h3>
      {description ? (
        <p className="max-w-2xl text-sm font-bold leading-6 text-stone-500">
          {description}
        </p>
      ) : null}
    </div>
  );
}
