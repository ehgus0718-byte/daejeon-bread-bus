import React from "react";

export default function AdminSectionTitle({
  eyebrow = "Admin Section",
  title = "관리 섹션",
  description = ""
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-black tracking-[0.18em] text-orange-600">
        {eyebrow}
      </p>
      <h3 className="text-3xl font-black text-stone-900">
        {title}
      </h3>
      {description ? (
        <p className="text-sm font-bold leading-6 text-stone-500">
          {description}
        </p>
      ) : null}
    </div>
  );
}
