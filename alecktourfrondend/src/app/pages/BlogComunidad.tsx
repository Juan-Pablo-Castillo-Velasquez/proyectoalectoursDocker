
const Navbar = () => (
  <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between h-16">
        <div className="flex items-center">
          <span className="text-2xl font-bold text-slate-800 tracking-tighter">
            Dev<span className="text-blue-600">Blog</span>
          </span>
          <div className="hidden md:ml-10 md:flex md:space-x-8">
            <a
              href="#"
              className="text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 border-blue-500 text-sm font-medium"
            >
              Inicio
            </a>
            <a
              href="#"
              className="text-gray-500 hover:text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-gray-300 text-sm font-medium"
            >
              Artículos
            </a>
            <a
              href="#"
              className="text-gray-500 hover:text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-gray-300 text-sm font-medium"
            >
              Tutoriales
            </a>
            <a
              href="#"
              className="text-gray-500 hover:text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-gray-300 text-sm font-medium"
            >
              Sobre Mí
            </a>
          </div>
        </div>
        <div className="flex items-center">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm">
            Suscribirse
          </button>
        </div>
      </div>
    </div>
  </nav>
);

const BlogContent = () => {
  const posts = [
    {
      id: 1,
      category: "Backend",
      title: "Optimizando consultas en PostgreSQL",
      excerpt:
        "Aprende a estructurar tus queries para reducir tiempos de respuesta en bases de datos relacionales.",
      author: "Juan Pablo",
      date: "21 Ago, 2026",
      img: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=800",
    },
    {
      id: 2,
      category: "DevOps",
      title: "Dockerizando tu aplicación paso a paso",
      excerpt:
        "Una guía completa para crear contenedores eficientes y desplegar sin dolores de cabeza.",
      author: "Juan Pablo",
      date: "18 Ago, 2026",
      img: "https://images.unsplash.com/photo-1605745341112-85968b19335b?auto=format&fit=crop&q=80&w=800",
    },
    {
      id: 3,
      category: "Frontend",
      title: "El poder de Vite + Tailwind CSS",
      excerpt:
        "Cómo configurar tu entorno de desarrollo frontend para que vuele desde el día uno.",
      author: "Juan Pablo",
      date: "10 Ago, 2026",
      img: "https://images.unsplash.com/photo-1555099962-4199c345e5dd?auto=format&fit=crop&q=80&w=800",
    },
  ];

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 min-h-screen">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
          Últimos Artículos
        </h1>
        <p className="mt-4 text-xl text-gray-500">
          Insights sobre desarrollo web, arquitectura de software y más.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <article
            key={post.id}
            className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 border border-gray-100 flex flex-col"
          >
            <img
              className="h-48 w-full object-cover"
              src={post.img}
              alt={post.title}
            />
            <div className="p-6 flex-1 flex flex-col justify-between">
              <div>
                <span className="text-sm font-semibold text-blue-600 uppercase tracking-wider">
                  {post.category}
                </span>
                <h3 className="mt-2 text-xl font-bold text-gray-900 leading-tight hover:text-blue-600 cursor-pointer">
                  {post.title}
                </h3>
                <p className="mt-3 text-gray-500 text-sm">{post.excerpt}</p>
              </div>
              <div className="mt-6 flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-slate-300 flex items-center justify-center text-slate-700 font-bold border-2 border-white shadow-sm">
                    {post.author.charAt(0)}
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">
                    {post.author}
                  </p>
                  <p className="text-sm text-gray-500">{post.date}</p>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
};

const Footer = () => (
  <footer className="bg-slate-900 text-white py-12 mt-auto">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="col-span-1 md:col-span-2">
          <span className="text-2xl font-bold tracking-tighter">
            Dev<span className="text-blue-400">Blog</span>
          </span>
          <p className="mt-4 text-slate-400 max-w-sm text-sm">
            Un espacio dedicado a compartir conocimientos sobre desarrollo
            backend, frontend, y las mejores prácticas de la industria.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wider mb-4">
            Enlaces Rápidos
          </h4>
          <ul className="space-y-2 text-slate-400 text-sm">
            <li>
              <a href="#" className="hover:text-white transition-colors">
                Sobre Mí
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-white transition-colors">
                Portafolio
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-white transition-colors">
                Contacto
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-white transition-colors">
                RSS Feed
              </a>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wider mb-4">
            Legal
          </h4>
          <ul className="space-y-2 text-slate-400 text-sm">
            <li>
              <a href="#" className="hover:text-white transition-colors">
                Política de Privacidad
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-white transition-colors">
                Términos de Servicio
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="mt-12 pt-8 border-t border-slate-800 text-center md:flex md:justify-between items-center text-sm text-slate-400">
        <p>
          &copy; {new Date().getFullYear()} DevBlog. Todos los derechos
          reservados.
        </p>
        <div className="mt-4 md:mt-0 space-x-6">
          <a href="#" className="hover:text-white">
            GitHub
          </a>
          <a href="#" className="hover:text-white">
            LinkedIn
          </a>
          <a href="#" className="hover:text-white">
            Twitter
          </a>
        </div>
      </div>
    </div>
  </footer>
);

export default function ProfessionalBlog() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900">
      <Navbar />
      <BlogContent />
      <Footer />
    </div>
  );
}
