import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import "../Styles/home.css";
// 👉 Renombra el mp3 a "nuevayol.mp3" (los espacios, el guion largo y los corchetes dan problemas en algunos deploys)
import song from "../assets/img/music.mp3";

/* ═══════════════ HELPERS ═══════════════ */
// Cloudinary: formato y calidad automáticos + ancho justo (carga MUCHO más rápido)
const cld = (url, t = "f_auto,q_auto,w_1080") => url.replace("/upload/", `/upload/${t}/`);
// Cloudinary genera la portada del video cambiando .mp4 → .jpg
const videoPoster = (url, w = 1080) => cld(url, `so_0,f_jpg,q_auto,w_${w}`).replace(/\.mp4$/, ".jpg");
const mediaSrc = (m, w = 1080) => (m.type === "video" ? videoPoster(m.src, w) : cld(m.src, `f_auto,q_auto,w_${w}`));
const mmss = (s) => (Number.isFinite(s) ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}` : "0:00");

const SLIDE_MS = 3800; // duración de cada foto en el carrusel
// 🎚️ Curva de volumen de la canción → [segundo, volumen de 0 a 1]
const VOLUME_CURVE = [
	[0, 0],      // arranca en silencio
	[4, 0.2],    // sube suave hasta 50% en 4 segundos
	[14, 0.3],   // se queda en 50% hasta el segundo 14
	[30, 0.1],  // baja poco a poco hasta 15% en el segundo 30 (y ahí se queda de fondo)
];
const IG_USER = "marianainfanteb";
const AVATAR = cld("https://res.cloudinary.com/k44zr7ap/image/upload/v1791822246/descarga.jpg", "f_auto,q_auto,w_400");
const CDN = "https://res.cloudinary.com/k44zr7ap";

/* ═══════════════ DATA ═══════════════ */
const COLLABS = [
	{
		id: "adidas",
		brand: "ADIDAS",
		tone: "ink",
		title: "Cara de Adidas Superstar",
		caption: "Mi cara de Adidas Superstar ✦ desliza para verlo todo 👉",
		url: "https://www.instagram.com/p/DV1XyCqAKrV/",
		media: [
			{ type: "image", src: `${CDN}/image/upload/v1791821766/SaveClip.App_650416963_18449061331128138_8226869624112527555_n.jpg` },
			{ type: "image", src: `${CDN}/image/upload/v1791821770/SaveClip.App_651550395_18449061322128138_1086204968104178627_n.jpg` },
			{ type: "video", src: `${CDN}/video/upload/v1791821776/SaveClip.App_AQNmRstiKFqe928PlnsDy_6BHK8BG60rJzrUEovHX8Rx4PEymL_ll96yZByB5sbFCSUnWRVnJl8IeCs_-t0K-YpeR4UC2rgPzzCRutM.mp4` },
			{ type: "image", src: `${CDN}/image/upload/v1791821780/SaveClip.App_650478649_18449061352128138_3824496061071478186_n.jpg` },
		],
	},
	{
		id: "lachis",
		brand: "ADICLUB",
		tone: "pink",
		title: "Lachis — bebida collab",
		caption: "Lachis, nuestra bebida collab 🥤💛",
		url: "https://www.instagram.com/p/DGyLsQTRWd-/",
		media: [
			{ type: "image", src: `${CDN}/image/upload/v1791821789/SaveClip.App_482429908_18390590503128138_2511257051993143462_n.jpg` },
			{ type: "image", src: `${CDN}/image/upload/v1791821797/SaveClip.App_482672262_18390590536128138_8309914609919209858_n.jpg` },
			{ type: "image", src: `${CDN}/image/upload/v1791821818/SaveClip.App_482387044_18390590566128138_2387896595353369991_n.jpg` },
			{ type: "image", src: `${CDN}/image/upload/v1791821831/SaveClip.App_482378885_18390590578128138_2020212390524902311_n.jpg` },
			{ type: "image", src: `${CDN}/image/upload/v1791821834/SaveClip.App_483142762_18390590563128138_377795304920297085_n.jpg` },
			{ type: "image", src: `${CDN}/image/upload/v1791821836/SaveClip.App_482691916_18390590587128138_8118974724519069046_n.jpg` },
			{ type: "image", src: `${CDN}/image/upload/v1791821839/SaveClip.App_482522430_18390590596128138_5389138912709326624_n.jpg` },
		],
	},
];

const LINKS = [
	{ id: "tiktok", label: "TikTok", handle: "@sisoymachis", meta: "501K seguidores · 66.5M likes", url: "https://www.tiktok.com/@sisoymachis", icon: "tiktok" },
	{ id: "instagram", label: "Instagram", handle: "@marianainfanteb", meta: "378K seguidores", url: "https://www.instagram.com/marianainfanteb", icon: "instagram" },
	{ id: "youtube", label: "YouTube", handle: "@sisoymachis", meta: "Los videos completos", url: "https://www.youtube.com/@sisoymachis", icon: "youtube" },
	{ id: "mail", label: "Marcas & colaboraciones", handle: "Hola@estamosready.com.co", meta: "Hagamos algo juntos ✦", url: "mailto:Hola@estamosready.com.co", icon: "mail" },
];

const FLOATERS = [
	{ g: "★", x: "7%", y: "12%", s: "26px", c: "var(--mc-pink)", t: "6s", dl: "0s" },
	{ g: "✦", x: "88%", y: "9%", s: "22px", c: "var(--mc-lime-deep)", t: "5s", dl: ".6s" },
	{ g: "♥", x: "92%", y: "38%", s: "20px", c: "var(--mc-pink)", t: "7s", dl: "1s" },
	{ g: "✦", x: "4%", y: "46%", s: "18px", c: "var(--mc-orange)", t: "5.5s", dl: ".3s" },
	{ g: "★", x: "90%", y: "68%", s: "18px", c: "var(--mc-orange)", t: "6.5s", dl: "1.4s" },
	{ g: "♥", x: "6%", y: "78%", s: "24px", c: "var(--mc-pink)", t: "6s", dl: ".8s" },
	{ g: "✦", x: "50%", y: "4%", s: "16px", c: "var(--mc-pink)", t: "4.5s", dl: "1.8s" },
	{ g: "☺", x: "94%", y: "88%", s: "22px", c: "var(--mc-ink)", t: "7s", dl: ".2s" },
];

const CONFETTI_COLORS = ["#ff3d8e", "#d8ff3e", "#ff8a1f", "#ffffff", "#1e0f17"];
const NAME = "M★CHIS".split("");
const MARQUEE_A = "AMAMOS? AMAMOS!!! ✦ SI SOY MACHIS ✦ ";
const MARQUEE_B = "CREANDO PARA USTEDES ♥ QUÉDATE, SOY CHÉVERE ♥ ";

/* ═══════════════ ICONS (genéricos, sin logos de marca) ═══════════════ */
const Icon = ({ name, size = 22 }) => {
	const p = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true };
	switch (name) {
		case "tiktok": return <svg {...p}><path d="M9 18V5l11-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="17" cy="16" r="3" /></svg>;
		case "instagram": return <svg {...p}><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" /></svg>;
		case "youtube": return <svg {...p}><rect x="2" y="5" width="20" height="14" rx="4" /><path d="M10 9l5 3-5 3z" fill="currentColor" /></svg>;
		case "mail": return <svg {...p}><rect x="3" y="5" width="18" height="14" rx="3" /><path d="M3 7l9 6 9-6" /></svg>;
		case "arrow": return <svg {...p}><path d="M7 17L17 7M8 7h9v9" /></svg>;
		case "heart": return <svg {...p}><path d="M12 20s-7-4.4-9.3-9C1.2 7.7 3.3 4 7 4c2 0 3.3 1 5 3 1.7-2 3-3 5-3 3.7 0 5.8 3.7 4.3 7-2.3 4.6-9.3 9-9.3 9z" /></svg>;
		case "comment": return <svg {...p}><path d="M21 12a8.5 8.5 0 0 1-12.6 7.4L3 21l1.6-5.4A8.5 8.5 0 1 1 21 12z" /></svg>;
		case "send": return <svg {...p}><path d="M22 3L10 14M22 3l-7 18-5-7-7-5z" /></svg>;
		case "bookmark": return <svg {...p}><path d="M19 21l-7-5-7 5V4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1z" /></svg>;
		case "play": return <svg {...p}><path d="M7 4l13 8-13 8z" fill="currentColor" stroke="none" /></svg>;
		case "pause": return <svg {...p}><rect x="6" y="4" width="4" height="16" rx="1" fill="currentColor" stroke="none" /><rect x="14" y="4" width="4" height="16" rx="1" fill="currentColor" stroke="none" /></svg>;
		case "close": return <svg {...p}><path d="M6 6l12 12M18 6L6 18" /></svg>;
		case "left": return <svg {...p}><path d="M15 18l-6-6 6-6" /></svg>;
		case "right": return <svg {...p}><path d="M9 6l6 6-6 6" /></svg>;
		case "share": return <svg {...p}><path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M16 6l-4-4-4 4M12 2v13" /></svg>;
		case "muted": return <svg {...p}><path d="M11 5L6 9H3v6h3l5 4z" /><path d="M22 9l-6 6M16 9l6 6" /></svg>;
		case "sound": return <svg {...p}><path d="M11 5L6 9H3v6h3l5 4z" /><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14" /></svg>;
		case "carousel": return <svg {...p}><rect x="7" y="7" width="13" height="13" rx="2" /><path d="M4 16V5a1 1 0 0 1 1-1h11" /></svg>;
		default: return null;
	}
};

const Verified = ({ size = 16, className = "" }) => (
	<svg width={size} height={size} viewBox="0 0 24 24" className={`mc-verified ${className}`} aria-label="Verificada">
		<path d="M12 1.5l2.6 1.9 3.2-.2 1 3.1 2.6 1.9-1 3.1 1 3.1-2.6 1.9-1 3.1-3.2-.2L12 22.5l-2.6-1.9-3.2.2-1-3.1-2.6-1.9 1-3.1-1-3.1 2.6-1.9 1-3.1 3.2.2z" fill="currentColor" />
		<path d="M8 12.3l2.6 2.6 5.6-5.6" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
	</svg>
);

/* ═══════════════ HOOKS ═══════════════ */
const useCountUp = (target, start, duration = 2400) => {
	const [v, setV] = useState(0);
	useEffect(() => {
		if (!start) return;
		let raf;
		const t0 = performance.now();
		const tick = (now) => {
			const p = Math.min(1, (now - t0) / duration);
			setV(Math.round(target * (1 - Math.pow(1 - p, 4))));
			if (p < 1) raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	}, [target, start, duration]);
	return v;
};

/* ═══════════════ PIECES ═══════════════ */
const Confetti = () => {
	const pieces = useMemo(
		() =>
			Array.from({ length: 80 }, (_, i) => ({
				left: Math.random() * 100,
				delay: Math.random() * 0.5,
				dur: 2.2 + Math.random() * 1.8,
				rot: (Math.random() * 2 - 1) * 720,
				drift: (Math.random() * 2 - 1) * 140,
				size: 6 + Math.random() * 8,
				color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
				round: Math.random() > 0.6,
			})),
		[]
	);
	return (
		<div className="mc-confetti" aria-hidden="true">
			{pieces.map((p, i) => (
				<i
					key={i}
					style={{
						left: `${p.left}%`,
						width: p.size,
						height: p.round ? p.size : p.size * 0.45,
						background: p.color,
						borderRadius: p.round ? "50%" : "2px",
						animationDelay: `${p.delay}s`,
						animationDuration: `${p.dur}s`,
						"--rot": `${p.rot}deg`,
						"--drift": `${p.drift}px`,
					}}
				/>
			))}
		</div>
	);
};

/* ═══════════════ MINI POST (carrusel tipo Instagram) ═══════════════ */
const PostModal = ({ collab, onClose }) => {
	const n = collab.media.length;
	const [idx, setIdx] = useState(0);
	const [paused, setPaused] = useState(false);
	const [drag, setDrag] = useState(0);
	const [dragging, setDragging] = useState(false);
	const [vProg, setVProg] = useState(0);
	const [muted, setMuted] = useState(true);
	const [liked, setLiked] = useState(false);
	const [saved, setSaved] = useState(false);
	const [burst, setBurst] = useState(0);
	const [leaving, setLeaving] = useState(false);
	const startX = useRef(null);
	const lastTap = useRef(0);
	const videoRef = useRef(null);
	const current = collab.media[idx];

	const go = useCallback((d) => {
		setVProg(0);
		setIdx((i) => (i + d + n) % n);
	}, [n]);

	const close = useCallback(() => {
		setLeaving(true);
		setTimeout(onClose, 320);
	}, [onClose]);

	// Pausa / play del video cuando se mantiene presionado
	useEffect(() => {
		const v = videoRef.current;
		if (!v) return;
		if (paused) v.pause();
		else v.play().catch(() => {});
	}, [paused, idx]);

	// Teclado + bloquear scroll del fondo
	useEffect(() => {
		const onKey = (e) => {
			if (e.key === "Escape") close();
			if (e.key === "ArrowRight") go(1);
			if (e.key === "ArrowLeft") go(-1);
		};
		window.addEventListener("keydown", onKey);
		const prev = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		return () => {
			window.removeEventListener("keydown", onKey);
			document.body.style.overflow = prev;
		};
	}, [close, go]);

	const like = () => {
		setLiked(true);
		setBurst((b) => b + 1);
	};

	// Swipe con mouse o dedo + mantener presionado para pausar + doble tap para like
	const onDown = (e) => {
		startX.current = e.clientX;
		setDragging(true);
		setPaused(true);
		e.currentTarget.setPointerCapture?.(e.pointerId);
	};
	const onMove = (e) => {
		if (startX.current === null) return;
		setDrag(e.clientX - startX.current);
	};
	const onUp = (e) => {
		if (startX.current === null) return;
		const dx = e.clientX - startX.current;
		startX.current = null;
		setDragging(false);
		setDrag(0);
		setPaused(false);
		if (dx < -50) go(1);
		else if (dx > 50) go(-1);
		else if (Math.abs(dx) < 8) {
			const now = Date.now();
			if (now - lastTap.current < 320) {
				like();
				lastTap.current = 0;
			} else lastTap.current = now;
		}
	};
	const onCancel = () => {
		startX.current = null;
		setDragging(false);
		setDrag(0);
		setPaused(false);
	};
	const stop = (e) => e.stopPropagation();

	return (
		<div className={`mc-modal ${leaving ? "is-leaving" : ""}`} onClick={close} role="dialog" aria-modal="true" aria-label={`Post: ${collab.title}`}>
			<article className="mc-post" onClick={stop}>
				<header className="mc-post-head">
					<span className="mc-post-avatar"><img src={AVATAR} alt="" /></span>
					<span className="mc-post-user">
						<strong>{IG_USER} <Verified size={14} /></strong>
						<small>Collab con {collab.brand.charAt(0) + collab.brand.slice(1).toLowerCase()}</small>
					</span>
					<button className="mc-post-close" onClick={close} aria-label="Cerrar"><Icon name="close" size={18} /></button>
				</header>

				<div
					className="mc-post-media"
					onPointerDown={onDown}
					onPointerMove={onMove}
					onPointerUp={onUp}
					onPointerCancel={onCancel}
				>
					<div className="mc-bars">
						{collab.media.map((m, i) => {
							const isCur = i === idx;
							const cls = i < idx ? "done" : isCur ? (m.type === "video" ? "vid" : "run") : "";
							const style = isCur
								? m.type === "video"
									? { width: `${vProg * 100}%` }
									: { animationDuration: `${SLIDE_MS}ms`, animationPlayState: paused ? "paused" : "running" }
								: undefined;
							return (
								<span key={i} className="mc-bar">
									<i
										key={isCur ? `run-${idx}` : `bar-${i}`}
										className={cls}
										style={style}
										onAnimationEnd={isCur && m.type !== "video" ? () => go(1) : undefined}
									/>
								</span>
							);
						})}
					</div>
					<span className="mc-post-index">{idx + 1}/{n}</span>

					<div className={`mc-track ${dragging ? "is-drag" : ""}`} style={{ transform: `translateX(calc(${-idx * 100}% + ${drag}px))` }}>
						{collab.media.map((m, i) => (
							<div className="mc-slide" key={i}>
								{m.type === "video" && i === idx ? (
									<video
										ref={videoRef}
										src={cld(m.src, "q_auto,w_1080")}
										poster={videoPoster(m.src)}
										autoPlay
										muted={muted}
										playsInline
										onTimeUpdate={(e) => {
											const v = e.currentTarget;
											setVProg(v.duration ? v.currentTime / v.duration : 0);
										}}
										onEnded={() => go(1)}
									/>
								) : (
									<img src={mediaSrc(m)} alt="" draggable={false} loading={Math.abs(i - idx) <= 1 ? "eager" : "lazy"} />
								)}
							</div>
						))}
					</div>

					<button className="mc-nav prev" onPointerDown={stop} onClick={() => go(-1)} aria-label="Anterior"><Icon name="left" size={18} /></button>
					<button className="mc-nav next" onPointerDown={stop} onClick={() => go(1)} aria-label="Siguiente"><Icon name="right" size={18} /></button>

					{current.type === "video" && (
						<button className="mc-mute" onPointerDown={stop} onClick={() => setMuted((m) => !m)} aria-label={muted ? "Activar sonido" : "Silenciar"}>
							<Icon name={muted ? "muted" : "sound"} size={16} />
						</button>
					)}

					{burst > 0 && <span key={burst} className="mc-burst"><Icon name="heart" size={110} /></span>}
					<span className="mc-swipe-hint">desliza ← →  ·  doble tap ♥</span>
				</div>

				<div className="mc-post-actions">
					<button className={`mc-act ${liked ? "liked" : ""}`} onClick={() => (liked ? setLiked(false) : like())} aria-label="Me gusta"><Icon name="heart" size={26} /></button>
					<a className="mc-act" href={collab.url} target="_blank" rel="noopener noreferrer" aria-label="Comentar en Instagram"><Icon name="comment" size={24} /></a>
					<a className="mc-act" href={collab.url} target="_blank" rel="noopener noreferrer" aria-label="Compartir"><Icon name="send" size={23} /></a>
					<span className="mc-dots" aria-hidden="true">
						{collab.media.map((_, i) => <i key={i} className={i === idx ? "on" : ""} />)}
					</span>
					<button className={`mc-act save ${saved ? "liked" : ""}`} onClick={() => setSaved((s) => !s)} aria-label="Guardar"><Icon name="bookmark" size={24} /></button>
				</div>

				<p className="mc-post-likes">{liked ? "Te encanta esto y a los Machis lovers 💛" : "Les encanta a los Machis lovers 💛"}</p>
				<p className="mc-post-caption"><b>{IG_USER}</b>{collab.caption}</p>

				<a className="mc-post-cta" href={collab.url} target="_blank" rel="noopener noreferrer">
					Ver post completo en Instagram <Icon name="arrow" size={18} />
				</a>
			</article>
		</div>
	);
};

/* ═══════════════ HOME ═══════════════ */
export const Home = () => {
	const [mounted, setMounted] = useState(false);
	const [confetti, setConfetti] = useState(0);
	const [openPost, setOpenPost] = useState(null);
	const [playing, setPlaying] = useState(false);
	const [time, setTime] = useState({ cur: 0, dur: 0 });
	const [tick, setTick] = useState(0);
	const [toast, setToast] = useState("");
	const audioRef = useRef(null);
	const fadeRef = useRef(null);
	const startedRef = useRef(false);

	const count = useCountUp(1000000, mounted);

	const startMusic = useCallback((resume = false) => {
		const a = audioRef.current;
		if (!a) return;
		clearInterval(fadeRef.current);
		// Al reanudar desde el vinilo no repite toda la curva: sube suave al volumen de fondo
		const restVol = VOLUME_CURVE[VOLUME_CURVE.length - 1][1];
		const curve = resume ? [[0, 0], [1.5, restVol]] : VOLUME_CURVE;
		const total = curve[curve.length - 1][0];
		const t0 = performance.now();
		a.volume = curve[0][1];
		fadeRef.current = setInterval(() => {
			const t = (performance.now() - t0) / 1000;
			if (t >= total) {
				a.volume = curve[curve.length - 1][1];
				return clearInterval(fadeRef.current);
			}
			const k = curve.findIndex(([s]) => s > t);
			const [s0, v0] = curve[k - 1];
			const [s1, v1] = curve[k];
			a.volume = Math.min(1, Math.max(0, v0 + (v1 - v0) * ((t - s0) / (s1 - s0))));
		}, 100);
		a.play().catch(() => {});
	}, []);

	// Entrada directa: animaciones + confeti apenas carga la página
	useEffect(() => {
		const raf = requestAnimationFrame(() => setMounted(true));
		setConfetti(Date.now());
		return () => cancelAnimationFrame(raf);
	}, []);

	// La música arranca con la primera interacción (deslizar en celular, clic/tecla en compu)
	useEffect(() => {
		const events = ["pointerdown", "touchend", "keydown", "wheel", "scroll"];
		const cleanup = () => events.forEach((ev) => window.removeEventListener(ev, tryStart));

		function tryStart(e) {
			const a = audioRef.current;
			if (!a || startedRef.current) return;
			// Si tocó el vinilo, dejamos que el botón maneje play/pausa
			if (e.target?.closest?.(".mc-vinyl")) return cleanup();
			startedRef.current = true;
			startMusic();
			// Si el navegador lo bloqueó (ej. rueda del mouse), seguimos escuchando
			setTimeout(() => {
				if (a.paused) startedRef.current = false;
				else cleanup();
			}, 400);
		}

		events.forEach((ev) => window.addEventListener(ev, tryStart, { passive: true }));
		return cleanup;
	}, [startMusic]);

	useEffect(() => {
		if (!confetti) return;
		const t = setTimeout(() => setConfetti(0), 4600);
		return () => clearTimeout(t);
	}, [confetti]);

	// Las portadas de las collabs van rotando solas
	useEffect(() => {
		const id = setInterval(() => setTick((t) => t + 1), 2600);
		return () => {
			clearInterval(id);
			clearInterval(fadeRef.current);
		};
	}, []);

	useEffect(() => {
		if (!toast) return;
		const t = setTimeout(() => setToast(""), 2200);
		return () => clearTimeout(t);
	}, [toast]);

	const toggleMusic = () => {
		const a = audioRef.current;
		if (!a) return;
		if (a.paused) startMusic(true);
		else a.pause();
	};

	const seek = (e) => {
		const a = audioRef.current;
		if (!a || !a.duration) return;
		const r = e.currentTarget.getBoundingClientRect();
		a.currentTime = ((e.clientX - r.left) / r.width) * a.duration;
	};

	const share = async () => {
		const data = { title: "Machis 💛", text: "Mira todo lo de Machis aquí ✨", url: window.location.href };
		try {
			if (navigator.share) return await navigator.share(data);
			await navigator.clipboard.writeText(data.url);
			setToast("¡Link copiado! 💛");
		} catch {
			/* el usuario canceló */
		}
	};

	const tilt = (e) => {
		const el = e.currentTarget;
		const r = el.getBoundingClientRect();
		const x = (e.clientX - r.left) / r.width - 0.5;
		const y = (e.clientY - r.top) / r.height - 0.5;
		el.style.setProperty("--rx", `${-y * 12}deg`);
		el.style.setProperty("--ry", `${x * 14}deg`);
		el.style.setProperty("--mx", `${(x + 0.5) * 100}%`);
		el.style.setProperty("--my", `${(y + 0.5) * 100}%`);
	};
	const untilt = (e) => {
		e.currentTarget.style.setProperty("--rx", "0deg");
		e.currentTarget.style.setProperty("--ry", "0deg");
	};

	const closePost = useCallback(() => setOpenPost(null), []);
	const progress = time.dur ? time.cur / time.dur : 0;

	return (
		<div className={`mc-wrap ${mounted ? "is-in" : ""}`}>
			{confetti > 0 && <Confetti key={confetti} />}

			{/* Fondo vivo */}
			<div className="mc-bg" aria-hidden="true">
				<span className="mc-blob b1" />
				<span className="mc-blob b2" />
				<span className="mc-blob b3" />
				{FLOATERS.map((f, i) => (
					<span key={i} className="mc-float" style={{ "--x": f.x, "--y": f.y, "--s": f.s, "--c": f.c, "--t": f.t, "--dl": f.dl }}>{f.g}</span>
				))}
				<div className="mc-grain" />
			</div>

			<button className="mc-share" onClick={share} aria-label="Compartir"><Icon name="share" size={18} /></button>

			<main className="mc-card">
				{/* ─── HEADER ─── */}
				<header className="mc-head">
					<span className="mc-pill mc-rise" style={{ "--d": ".05s" }}><i /> CREANDO PARA USTEDES ✨</span>

					<div className="mc-avatar-wrap mc-rise" style={{ "--d": ".12s" }}>
						<svg className="mc-ring" viewBox="0 0 200 200" aria-hidden="true">
							<defs>
								<path id="mcRingPath" d="M100,100 m-82,0 a82,82 0 1,1 164,0 a82,82 0 1,1 -164,0" />
							</defs>
							<text>
								<textPath href="#mcRingPath" textLength="512" lengthAdjust="spacing">
									SI SOY MACHIS ✦ CREANDO PARA USTEDES ✦ AMAMOS? AMAMOS!!! ✦
								</textPath>
							</text>
						</svg>
						<div className="mc-avatar"><img src={AVATAR} alt="Machis" /></div>
						<Verified size={30} className="mc-avatar-badge" />
					</div>

					<h1 className="mc-name" aria-label="Machis">
						{NAME.map((c, i) => (
							<span key={i} className={c === "★" ? "star" : ""} style={{ "--i": i }} aria-hidden="true">{c}</span>
						))}
					</h1>
					<p className="mc-handle mc-rise" style={{ "--d": ".5s" }}>@sisoymachis · creadora de contenido</p>
					<p className="mc-quote mc-rise" style={{ "--d": ".6s" }}>amamos? <b>AMAMOS!!!</b> 💛</p>
				</header>

				{/* ─── CONTADOR ─── */}
				<section className="mc-stats mc-rise" style={{ "--d": ".7s" }}>
					<div className="mc-counter">
						<span className="mc-spark s1">✦</span>
						<span className="mc-spark s2">★</span>
						<span className="mc-spark s3">✦</span>
						<strong>+{count.toLocaleString("es-CO")}</strong>
						<small>MACHIS LOVERS EN TODAS LAS REDES</small>
					</div>
					<div className="mc-chips">
						<span><b>501K</b> TikTok</span>
						<span><b>378K</b> Instagram</span>
						<span><b>66.5M</b> likes</span>
					</div>
				</section>

				{/* ─── CINTAS ─── */}
				<div className="mc-tapes" aria-hidden="true">
					<div className="mc-tape t2"><div className="mc-tape-inner"><span>{MARQUEE_B.repeat(4)}</span><span>{MARQUEE_B.repeat(4)}</span></div></div>
					<div className="mc-tape t1"><div className="mc-tape-inner"><span>{MARQUEE_A.repeat(4)}</span><span>{MARQUEE_A.repeat(4)}</span></div></div>
				</div>

				{/* ─── COLLABS ─── */}
				<div className="mc-section-title mc-rise" style={{ "--d": ".85s" }}>
					<h2>ÚLTIMAS COLLABS</h2>
					<span>tócalas ✦</span>
				</div>
				<div className="mc-collabs">
					{COLLABS.map((c, i) => {
						const preview = c.media.slice(0, 4);
						return (
							<div key={c.id} className="mc-rise" style={{ "--d": `${0.9 + i * 0.1}s` }}>
								<button className="mc-collab" onClick={() => setOpenPost(c)} onMouseMove={tilt} onMouseLeave={untilt} aria-label={`Ver collab ${c.title}`}>
									<span className="mc-collab-media">
										{preview.map((m, j) => (
											<img key={j} src={mediaSrc(m, 600)} className={j === tick % preview.length ? "on" : ""} alt="" loading="lazy" draggable={false} />
										))}
									</span>
									<span className={`mc-collab-brand ${c.tone}`}>{c.brand}</span>
									<span className="mc-collab-count"><Icon name="carousel" size={13} />{c.media.length}</span>
									<span className="mc-collab-info">
										<strong>{c.title}</strong>
										<em>ver post <Icon name="arrow" size={13} /></em>
									</span>
									<span className="mc-collab-glare" />
								</button>
							</div>
						);
					})}
				</div>

				{/* ─── CANCIÓN DEL MOMENTO ─── */}
				<div className="mc-player mc-rise" style={{ "--d": "1.1s" }}>
					<button className="mc-vinyl" onClick={toggleMusic} aria-label={playing ? "Pausar canción" : "Reproducir canción"}>
						<span className={`mc-disc ${playing ? "spin" : ""}`}>
							<span className="mc-disc-label" style={{ backgroundImage: `url(${AVATAR})` }} />
						</span>
						<span className="mc-vinyl-icon"><Icon name={playing ? "pause" : "play"} size={12} /></span>
					</button>
					<div className="mc-player-info">
						<small>CANCIÓN DEL MOMENTO</small>
						<strong>NUEVAYoL</strong>
						<span>Bad Bunny</span>
						<div className="mc-progress" onClick={seek}><i style={{ width: `${progress * 100}%` }} /></div>
						<div className="mc-time"><span>{mmss(time.cur)}</span><span>{mmss(time.dur)}</span></div>
					</div>
					<div className={`mc-eq ${playing ? "on" : ""}`} aria-hidden="true"><i /><i /><i /><i /><i /></div>
					<audio
						ref={audioRef}
						src={song}
						loop
						preload="metadata"
						onPlay={() => setPlaying(true)}
						onPause={() => setPlaying(false)}
						onLoadedMetadata={(e) => setTime({ cur: 0, dur: e.currentTarget.duration })}
						onTimeUpdate={(e) => setTime({ cur: e.currentTarget.currentTime, dur: e.currentTarget.duration })}
					/>
				</div>

				{/* ─── REDES ─── */}
				<nav className="mc-links">
					{LINKS.map((l, i) => (
						<a
							key={l.id}
							href={l.url}
							target={l.id === "mail" ? undefined : "_blank"}
							rel="noopener noreferrer"
							className={`mc-link mc-rise is-${l.id}`}
							style={{ "--d": `${1.2 + i * 0.08}s` }}
						>
							<span className="mc-link-fill" />
							<span className="mc-link-icon"><Icon name={l.icon} size={22} /></span>
							<span className="mc-link-text">
								<small>{l.label}</small>
								<strong>{l.handle}</strong>
								<em>{l.meta}</em>
							</span>
							<span className="mc-link-arrow"><Icon name="arrow" size={18} /></span>
						</a>
					))}
				</nav>

				<footer className="mc-foot mc-rise" style={{ "--d": "1.6s" }}>
					<p>hecho con amor para los Machis lovers 💛</p>
					<small>MACHIS · {new Date().getFullYear()}</small>
				</footer>
			</main>

			{openPost && <PostModal collab={openPost} onClose={closePost} />}
			{toast && <div className="mc-toast">{toast}</div>}
		</div>
	);
};

export default Home;