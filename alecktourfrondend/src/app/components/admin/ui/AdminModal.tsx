import type { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../../ui/dialog";

interface AdminModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  /** Clase tailwind de ancho máximo, ej: "sm:max-w-2xl" */
  maxWidth?: string;
}

// Modal centrado reutilizable para formularios/información compleja —
// reemplaza a los "cuadros" hechos a mano que quedaban pegados a una
// esquina de la pantalla. Se apoya en Dialog de Radix (ya usado en el
// resto del proyecto), que centra, agrega backdrop, cierra con X/ESC y
// anima la apertura sin que tengamos que reimplementar nada de eso.
export default function AdminModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  maxWidth = "sm:max-w-lg",
}: AdminModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`${maxWidth} w-full bg-card border-border max-h-[85vh] overflow-y-auto`}>
        <DialogHeader>
          <DialogTitle className="text-foreground">{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="py-1">{children}</div>
        {footer && <DialogFooter>{footer}</DialogFooter>}
      </DialogContent>
    </Dialog>
  );
}
