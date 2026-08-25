import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import { Link } from "react-router";
//
const articles = [
    {
        category: "Guías",
        title: "10 playas paradisíacas en el Caribe colombiano",
        img: "https://images.unsplash.com/photo-1590523278191-995cbcda646b?q=80&w=900&auto=format&fit=crop",
        link: "/blog/playas-caribe-colombiano",
    },
    {
        category: "Tips",
        title: "Consejos para viajar internacionalmente sin contratiempos",
        img: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=900&auto=format&fit=crop",
        link: "/blog/tips-viajar-internacional",
    },
    {
        category: "Destinos",
        title: "Lugares románticos para viajar en pareja",
        img: "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?q=80&w=900&auto=format&fit=crop",
        link: "/blog/destinos-romanticos",
    },
    {
        category: "Tendencias",
        title: "Destinos en tendencia para 2026",
        img: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=900&auto=format&fit=crop",
        link: "/blog/tendencias-2026",
    },
];

export default function BlogGuides() {
    return (
        <></>
        // <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        //     <motion.div
        //         initial={{ opacity: 0, y: 16 }}
        //         whileInView={{ opacity: 1, y: 0 }}
        //         viewport={{ once: true, margin: "-80px" }}
        //         transition={{ duration: 0.6 }}
        //         className="flex flex-col md:flex-row md:items-end md:justify-between mb-8 gap-3"
        //     >
        //         <div>
        //             <div className="flex items-center gap-2 mb-2">
        //                 <span className="h-px w-8 bg-[#C9A227]" />
        //                 <span className="text-[#7B1E3A] text-[11px] font-bold uppercase tracking-[0.2em]">
        //                     Inspírate para tu próxima aventura
        //                 </span>
        //             </div>
        //             <h2
        //                 className="text-2xl md:text-3xl text-[#2E2E2E]"
        //                 style={{ fontFamily: "'Fraunces', serif", fontWeight: 600 }}
        //             >
        //                 Ideas, guías y consejos de viaje
        //             </h2>
        //         </div>
        //         <Link
        //             to="/blog"
        //             className="flex items-center gap-1.5 text-[#7B1E3A] text-sm font-semibold hover:gap-2.5 transition-all"
        //         >
        //             Ver todos los artículos
        //             <ArrowRight className="w-4 h-4" />
        //         </Link>
        //     </motion.div>

        //     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        //         {articles.map((a, i) => (
        //             <motion.article
        //                 key={a.title}
        //                 initial={{ opacity: 0, y: 20 }}
        //                 whileInView={{ opacity: 1, y: 0 }}
        //                 viewport={{ once: true, margin: "-60px" }}
        //                 transition={{ delay: i * 0.1, duration: 0.5 }}
        //                 className="group cursor-pointer"
        //             >
        //                 <Link to={a.link}>
        //                     <div className="relative h-36 rounded-2xl overflow-hidden mb-3">
        //                         <img
        //                             src={a.img}
        //                             alt={a.title}
        //                             className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        //                         />
        //                     </div>
        //                     <span className="text-[#7B1E3A] text-[10px] font-bold uppercase tracking-[0.15em]">
        //                         {a.category}
        //                     </span>
        //                     <h3 className="text-[#2E2E2E] font-semibold text-[15px] leading-snug mt-1 mb-2 line-clamp-2">
        //                         {a.title}
        //                     </h3>
        //                     <span className="inline-flex items-center gap-1 text-[#C9A227] text-xs font-semibold">
        //                         Leer más
        //                         <ArrowRight className="w-3 h-3" />
        //                     </span>
        //                 </Link>
        //             </motion.article>
        //         ))}
        //     </div>
        // </section>
    );
}