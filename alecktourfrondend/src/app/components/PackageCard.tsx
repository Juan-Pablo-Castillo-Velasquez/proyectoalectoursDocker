import { Link } from "react-router";
import { Plane, Bus, Clock, Star, ArrowRight, MapPin } from "lucide-react";
import { TravelPackage } from "../data/packages";
import { motion } from "motion/react";

interface PackageCardProps {
  package: TravelPackage;
  index?: number;
}

export default function PackageCard({ package: pkg, index = 0 }: PackageCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -8, transition: { duration: 0.3 } }}
    >
      <Link
        to={`/package/${pkg.id}`}
        className="group block bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden"
      >
        {/* Image */}
        <div className="relative h-64 overflow-hidden">
          <motion.img
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.6 }}
            src={pkg.image}
            alt={pkg.destination}
            className="w-full h-full object-cover"
          />
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          
          {/* Transport Badge */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 + index * 0.1 }}
            className="absolute top-4 right-4"
          >
            <div className="bg-white/95 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg">
              {pkg.transport === "vuelo" ? (
                <div className="flex items-center gap-2">
                  <Plane className="w-4 h-4 text-[#FF6B35]" />
                  <span className="text-sm font-semibold text-foreground">Vuelo</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Bus className="w-4 h-4 text-[#FF6B35]" />
                  <span className="text-sm font-semibold text-foreground">Bus</span>
                </div>
              )}
            </div>
          </motion.div>

          {/* Destination Badge */}
          <div className="absolute bottom-4 left-4 flex items-center gap-2 text-white">
            <MapPin className="w-5 h-5" />
            <span className="text-2xl font-bold drop-shadow-lg">{pkg.destination}</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-orange-50 px-3 py-1 rounded-full">
                <Star className="w-4 h-4 fill-[#F7931E] text-[#F7931E]" />
                <span className="text-sm font-bold text-foreground">{pkg.rating}</span>
              </div>
              <span className="text-sm text-muted-foreground">({pkg.reviews})</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">{pkg.duration}</span>
            </div>
          </div>

          <p className="text-muted-foreground text-sm mb-4 line-clamp-2">{pkg.description}</p>

          <div className="flex items-end justify-between pt-4 border-t border-border">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Desde</p>
              <p className="text-3xl font-bold bg-gradient-to-r from-[#FF6B35] to-[#F7931E] bg-clip-text text-transparent">
                ${pkg.price.toLocaleString("es-CO")}
              </p>
              <p className="text-xs text-muted-foreground">por persona</p>
            </div>
            <motion.div
              whileHover={{ x: 5 }}
              className="flex items-center gap-2 text-[#FF6B35] font-semibold group-hover:gap-3 transition-all duration-300"
            >
              <span>Ver más</span>
              <ArrowRight className="w-5 h-5" />
            </motion.div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
