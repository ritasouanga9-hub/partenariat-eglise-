import React, { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Circle, RotateCcw, Wallet, CalendarDays, TrendingUp, UserRound, ImagePlus } from "lucide-react";

const MONTHS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
];

const DEFAULT_MONTHLY_AMOUNT = 20000;
const STORAGE_KEY = "partenariat-eglise-pwa-v1";

function formatFCFA(amount) {
  return new Intl.NumberFormat("fr-FR").format(Number(amount || 0)) + " FCFA";
}

function readFileAsDataURL(file, callback) {
  const reader = new FileReader();
  reader.onload = () => callback(reader.result);
  reader.readAsDataURL(file);
}

export default function App() {
  const currentYear = new Date().getFullYear();

  const [year, setYear] = useState(currentYear);
  const [payments, setPayments] = useState({});
  const [monthlyAmount, setMonthlyAmount] = useState(DEFAULT_MONTHLY_AMOUNT);
  const [memberName, setMemberName] = useState("Nom du membre");
  const [churchName, setChurchName] = useState("Partenariat des Membres Exclusifs");
  const [logo, setLogo] = useState(null);
  const [memberPhoto, setMemberPhoto] = useState(null);
  const [primaryColor, setPrimaryColor] = useState("#111827");
  const [accentColor, setAccentColor] = useState("#f5f5f5");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setPayments(data.payments || {});
        setMonthlyAmount(data.monthlyAmount || DEFAULT_MONTHLY_AMOUNT);
        setMemberName(data.memberName || "Nom du membre");
        setChurchName(data.churchName || "Partenariat des Membres Exclusifs");
        setLogo(data.logo || null);
        setMemberPhoto(data.memberPhoto || null);
        setPrimaryColor(data.primaryColor || "#111827");
        setAccentColor(data.accentColor || "#f5f5f5");
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      payments, monthlyAmount, memberName, churchName, logo, memberPhoto, primaryColor, accentColor
    }));
  }, [payments, monthlyAmount, memberName, churchName, logo, memberPhoto, primaryColor, accentColor]);

  const yearPayments = payments[year] || {};
  const paidCount = useMemo(() => MONTHS.filter((m) => yearPayments[m]?.paid).length, [yearPayments]);
  const totalToPay = Number(monthlyAmount || 0) * 12;
  const totalPaid = paidCount * Number(monthlyAmount || 0);
  const remaining = totalToPay - totalPaid;
  const progress = totalToPay > 0 ? Math.round((totalPaid / totalToPay) * 100) : 0;

  const togglePayment = (month) => {
    const current = yearPayments[month];
    if (current?.paid) {
      const confirmed = window.confirm(`Annuler le paiement de ${month} ?`);
      if (!confirmed) return;
      setPayments((prev) => ({
        ...prev,
        [year]: { ...(prev[year] || {}), [month]: { paid: false } }
      }));
      return;
    }

    const method = window.prompt(`Mode de paiement pour ${month} : écris Mobile Money ou Espèce`, "Mobile Money");
    if (method === null) return;

    setPayments((prev) => ({
      ...prev,
      [year]: {
        ...(prev[year] || {}),
        [month]: {
          paid: true,
          date: new Date().toLocaleDateString("fr-FR"),
          method: method || "Non renseigné",
          receiptNumber: `RECU-${year}-${MONTHS.indexOf(month) + 1}-${Date.now().toString().slice(-5)}`
        }
      }
    }));
  };

  const printReceipt = (month) => {
    const payment = yearPayments[month];
    if (!payment?.paid) return;

    const html = `
      <html>
        <head><title>Reçu</title></head>
        <body style="font-family:Arial;padding:24px;line-height:1.6">
          <div style="max-width:420px;margin:auto;border:1px solid #ddd;border-radius:18px;padding:22px">
            ${logo ? `<img src="${logo}" style="width:70px;height:70px;object-fit:cover;border-radius:14px" />` : ""}
            <h2>REÇU DE PAIEMENT</h2>
            <p><strong>${churchName}</strong></p>
            <p>Membre : <strong>${memberName}</strong></p>
            <p>Mois : <strong>${month} ${year}</strong></p>
            <p>Montant : <strong>${formatFCFA(monthlyAmount)}</strong></p>
            <p>Date : <strong>${payment.date}</strong></p>
            <p>Mode de paiement : <strong>${payment.method}</strong></p>
            <p>N° reçu : <strong>${payment.receiptNumber}</strong></p>
            <hr />
            <p>Merci pour votre partenariat.</p>
          </div>
        </body>
      </html>
    `;

    const win = window.open("", "_blank");
    win.document.write(html);
    win.document.close();
    win.print();
  };

  const resetYear = () => {
    if (!window.confirm("Effacer les paiements de cette année ?")) return;
    setPayments((prev) => {
      const copy = { ...prev };
      delete copy[year];
      return copy;
    });
  };

  return (
    <main className="app" style={{ backgroundColor: accentColor }}>
      <section className="container">
        <header className="hero">
          <div className="identity">
            {logo && <img src={logo} alt="Logo" className="logo" />}
            <div>
              <p className="label">Suivi personnel</p>
              <h1>{churchName}</h1>
              <div className="member-line">
                {memberPhoto ? <img src={memberPhoto} alt="Membre" className="avatar" /> : <UserRound size={38} />}
                <strong>{memberName}</strong>
              </div>
              <p>Cotisation mensuelle : <strong>{formatFCFA(monthlyAmount)}</strong></p>
            </div>
          </div>
        </header>

        <section className="settings">
          <label>Nom du membre
            <input value={memberName} onChange={(e) => setMemberName(e.target.value)} />
          </label>

          <label>Nom du partenariat
            <input value={churchName} onChange={(e) => setChurchName(e.target.value)} />
          </label>

          <label>Montant mensuel
            <input type="number" value={monthlyAmount} onChange={(e) => setMonthlyAmount(e.target.value)} />
          </label>

          <label>Logo de l’église
            <input type="file" accept="image/*" onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) readFileAsDataURL(file, setLogo);
            }} />
          </label>

          <label>Photo du membre
            <input type="file" accept="image/*" onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) readFileAsDataURL(file, setMemberPhoto);
            }} />
          </label>

          <label>Couleur principale
            <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} />
          </label>

          <label>Couleur de fond
            <input type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} />
          </label>
        </section>

        <div className="year-row">
          <button onClick={() => setYear(year - 1)}>Année -</button>
          <span>{year}</span>
          <button onClick={() => setYear(year + 1)}>Année +</button>
        </div>

        <section className="stats">
          <article><Wallet /><small>Payé</small><strong>{formatFCFA(totalPaid)}</strong></article>
          <article><TrendingUp /><small>Reste</small><strong>{formatFCFA(remaining)}</strong></article>
          <article><CalendarDays /><small>Mois payés</small><strong>{paidCount} / 12</strong></article>
          <article><CheckCircle2 /><small>Progression</small><strong>{progress}%</strong></article>
        </section>

        <section className="progress-card">
          <div className="progress-title">
            <h2>Progression annuelle</h2>
            <button className="ghost" onClick={resetYear}><RotateCcw size={16} /> Réinitialiser</button>
          </div>
          <div className="bar"><div style={{ width: `${progress}%`, backgroundColor: primaryColor }} /></div>
          <p>Objectif annuel : <strong>{formatFCFA(totalToPay)}</strong></p>
        </section>

        <section className="months">
          {MONTHS.map((month) => {
            const payment = yearPayments[month];
            const isPaid = payment?.paid;
            return (
              <button key={month} className={`month ${isPaid ? "paid" : ""}`} onClick={() => togglePayment(month)}>
                <div>
                  <h3>{month}</h3>
                  <p>Montant : {formatFCFA(monthlyAmount)}</p>
                  {isPaid ? (
                    <>
                      <p><strong>Payé le {payment.date}</strong></p>
                      <p>Mode : {payment.method}</p>
                      <p className="confirm">Paiement confirmé par l’application</p>
                    </>
                  ) : <p>Non payé</p>}
                </div>

                {isPaid ? (
                  <div className="receipt-area">
                    <CheckCircle2 style={{ color: primaryColor }} />
                    <span onClick={(e) => { e.stopPropagation(); printReceipt(month); }} style={{ backgroundColor: primaryColor }}>
                      Reçu
                    </span>
                  </div>
                ) : <Circle className="muted" />}
              </button>
            );
          })}
        </section>
      </section>
    </main>
  );
}
