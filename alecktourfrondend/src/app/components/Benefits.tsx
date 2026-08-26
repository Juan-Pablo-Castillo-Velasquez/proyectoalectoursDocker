import { CreditCard, HeadphonesIcon, ShieldCheck } from "lucide-react";
import { motion } from "motion/react";

const perks = [
    {
        icon: CreditCard,
        title: "Paga en cuotas, sin intereses",
        desc: "Hasta 12 cuotas con tu tarjeta. El plan que mejor se acomode a tu bolsillo, no al revés.",
    },
    {
        icon: HeadphonesIcon,
        title: "Asesoría humana, siempre",
        desc: "Un asesor AlecTours te acompaña antes, durante y después del viaje. Sin bots que no resuelven.",
    },
    {
        icon: ShieldCheck,
        title: "Compra protegida",
        desc: "Cambios, cancelaciones y reembolsos claros desde el primer momento. Sin letra pequeña.",
    },
];

export default function Benefits() {
    return (
        <section className="bg-muted/30 transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {perks.map((p, i) => (
                        <motion.div
                            key={p.title}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-60px" }}
                            transition={{ delay: i * 0.12, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                            className="flex flex-col items-start"
                        >
                            <div
                                className="
                                    w-14 h-14 
                                    rounded-2xl 
                                    flex items-center justify-center 
                                    mb-5
                                    bg-gradient-to-br from-primary to-primary/80
                                    shadow-lg shadow-primary/30
                                "
                            >
                                <p.icon className="w-6 h-6 text-primary-foreground" strokeWidth={1.75} />
                            </div>

                            <h3 className="text-foreground font-semibold text-lg mb-2">
                                {p.title}
                            </h3>

                            <p className="text-muted-foreground leading-relaxed text-[15px]">
                                {p.desc}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}