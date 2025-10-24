import Footer from "@/components/Footer";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#FFFBEb] flex flex-col">
      <main className="flex-1 px-6 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-[#5C5537] mb-8">
            About Trackboxd
          </h1>
          
          <p className="text-lg text-[#5C5537]/80 leading-relaxed">
            Trackboxd is a social platform for music lovers to discover, track, and share their favorite songs and albums. 
            Connect with fellow music enthusiasts, create personalized playlists, and explore new sounds through our community-driven recommendations.
          </p>
        </div>
      </main>
      
      <Footer variant="light" />
    </div>
  );
}