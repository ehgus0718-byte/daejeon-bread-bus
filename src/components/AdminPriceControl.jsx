import React from "react";

function formatDate(dateString) {
  if (!dateString) return "-";

  const date = new Date(dateString);

  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
}

function formatPrice(value) {
  return `${Number(value || 0).toLocaleString()}원`;
}

export default function AdminPriceControl({
  priceOverrides = {},
  onChangePrice
}) {
  const entries = Object.entries(priceOverrides);

  return (
    <section className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-black text-orange-600">
            Admin Price Control
          </p>
          <h3 className="mt-1 text-3xl font-black text-stone-900">
            날짜별 가격 관리
          </h3>
        </div>

        <div className="rounded-full bg-stone-100 px-4 py-2 text-xs font-black text-stone-700">
          총 {entries.length}개 날짜 관리중
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-3xl border border-stone-100">
        <div className="grid grid-cols-3 bg-stone-50 px-5 py-4 text-xs font-black text-stone-500">
          <div>날짜</div>
          <div>현재 가격</div>
          <div>가격 수정</div>
        </div>

        <div className="divide-y divide-stone-100">
          {entries.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm font-bold text-stone-400">
              설정된 가격 정보가 없습니다.
            </div>
          ) : (
            entries.map(([date, price]) => (
              <div
                key={date}
                className="grid grid-cols-3 items-center gap-4 px-5 py-5 text-sm font-bold text-stone-700"
              >
                <div>{formatDate(date)}</div>

                <div>{formatPrice(price)}</div>

                <div>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={price}
                    onChange={(event) =>
                      onChangePrice?.(
                        date,
                        Number(event.target.value)
                      )
                    }
                    className="w-full rounded-2xl border border-stone-200 px-3 py-3 text-sm font-black outline-none transition focus:border-orange-400"
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
