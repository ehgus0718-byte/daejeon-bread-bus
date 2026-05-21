import React, { useMemo, useState } from "react";
import TwoMonthCalendar from "./components/TwoMonthCalendar.jsx";
import ReservationPanel from "./components/ReservationPanel.jsx";
import ReservationList from "./components/ReservationList.jsx";
import AdminReservationTable from "./components/AdminReservationTable.jsx";
import {
  DEFAULT_DATE_SETTINGS,
  getRemainingSeats,
  getPrice
} from "./core/reservationSchema.js";

const initialReservations = [
  {
    id: "r1",
    date: "2026-05-30",
    name: "김민수",
    people: 8,
    status: "결제완료",
    createdAt: "2026-05-21T09:00:00"
  },
  {
    id: "r2",
    date: "2026-06-06",
    name: "이서연",
    people: 13,
    status: "예약확정",
    createdAt: "2026-05-21T10:00:00"
  }
];

export default function AppSafe() {
  const [selectedDate, setSelectedDate] = useState("2026-05-30");

  const [reservationForm, setReservationForm] = useState({
    name: "",
    phone: "",
    people: 1
  });

  const [reservations, setReservations] = useState(initialReservations);
  const [notice, setNotice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function remaining(date) {
    return getRemainingSeats({
      reservations,
      dateSettings: DEFAULT_DATE_SETTINGS,
      date,
      fallbackCapacity: 15
    });
  }

  const selectedPrice = useMemo(() => {
    return getPrice(DEFAULT_DATE_SETTINGS, selectedDate, 30000);
  }, [selectedDate]);

  function handleFormChange(key, value) {
    setReservationForm((prev) => ({
      ...prev,
      [key]: value
    }));
  }

  function resetForm() {
    setReservationForm({
      name: "",
      phone: "",
      people: 1
    });
  }

  function handleReservationStatusChange(id, nextStatus) {
    setReservations((prev) =>
      prev.map((reservation) => {
        if (reservation.id !== id) {
          return reservation;
        }

        return {
          ...reservation,
          status: nextStatus
        };
      })
    );
  }

  function handleSubmit() {
    setNotice("");

    if (!selectedDate) {
      setNotice("예약 날짜를 선택해주세요.");
      return;
    }

    if (!reservationForm.name?.trim()) {
      setNotice("예약자명을 입력해주세요.");
      return;
    }

    if (!reservationForm.phone?.trim()) {
      setNotice("연락처를 입력해주세요.");
      return;
    }

    const remainingSeats = remaining(selectedDate);

    if (reservationForm.people > remainingSeats) {
      setNotice("잔여 좌석이 부족합니다.");
      return;
    }

    setIsSubmitting(true);

    const reservationItem = {
      id: crypto.randomUUID(),
      date: selectedDate,
      name: reservationForm.name.trim(),
      phone: reservationForm.phone.trim(),
      people: reservationForm.people,
      status: "결제대기",
      createdAt: new Date().toISOString()
    };

    setReservations((prev) => [...prev, reservationItem]);

    setNotice("예약이 저장되었습니다. 결제를 진행해주세요.");

    resetForm();
    setIsSubmitting(false);
  }

  return (
    <div className="min-h-screen bg-[#fff8ef] text-stone-950">
      <header className="border-b border-orange-100 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500 text-2xl text-white shadow-lg shadow-orange-200">
              🚌
            </div>
            <div>
              <h1 className="text-xl font-black">대전빵셔틀 빵버스</h1>
              <p className="text-xs font-bold text-stone-500">
                2026 Reservation Platform
              </p>
            </div>
          </div>

          <div className="rounded-full bg-orange-50 px-4 py-2 text-xs font-black text-orange-700">
            실제 운영 구조 안정화 중
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-12">
        <section className="rounded-[2.5rem] bg-stone-950 p-8 text-white shadow-2xl shadow-orange-100 md:p-12">
          <p className="text-sm font-black tracking-[0.3em] text-orange-300">
            DAEJEON BREAD BUS
          </p>

          <h2 className="mt-4 text-4xl font-black leading-tight md:text-6xl">
            달력으로 선택하고
            <br />
            대전 빵버스를 예약하세요.
          </h2>

          <p className="mt-6 max-w-2xl text-base font-bold leading-7 text-stone-300">
            날짜별 모집현황, 잔여좌석, 예약마감 상태를 한 번에 확인할 수 있는
            실제 운영형 예약 플랫폼 구조입니다.
          </p>
        </section>

        <section className="mt-10">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-black text-orange-600">
                Reservation Calendar
              </p>
              <h3 className="text-3xl font-black">
                2개월 예약 달력
              </h3>
            </div>

            <div className="rounded-full bg-white px-4 py-3 text-sm font-black shadow-sm">
              관리자에서 날짜별 정원 수정 가능
            </div>
          </div>

          <TwoMonthCalendar
            currentDate={new Date(2026, 4, 1)}
            dateSettings={DEFAULT_DATE_SETTINGS}
            getRemainingSeats={remaining}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />
        </section>

        <section className="mt-10">
          <ReservationPanel
            selectedDate={selectedDate}
            remainingSeats={remaining(selectedDate)}
            price={selectedPrice}
            form={reservationForm}
            onChange={handleFormChange}
            onSubmit={handleSubmit}
            notice={notice}
            isSubmitting={isSubmitting}
          />
        </section>

        <section className="mt-10">
          <ReservationList reservations={reservations} />
        </section>

        <section className="mt-10">
          <AdminReservationTable
            reservations={reservations}
            onChangeStatus={handleReservationStatusChange}
          />
        </section>
      </main>
    </div>
  );
}
