import Footer from "@/components/Footer";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#FFFBEb] flex flex-col">
      <main className="flex-1 px-6 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-[#5C5537] mb-8">
            Contact Us
          </h1>
          
          <p className="text-lg text-[#5C5537]/80 mb-12">
            Get in touch with us through any of these channels:
          </p>
          
          <div className="space-y-6">
            <div className="flex items-center justify-center space-x-4">
              <div className="text-[#5C5537] font-medium">Instagram:</div>
              <a 
                href="https://instagram.com/trackboxd" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[#5C5537] hover:text-[#3E3725] transition-colors duration-200 font-medium"
              >
                @trackboxd
              </a>
            </div>
            
            <div className="flex items-center justify-center space-x-4">
              <div className="text-[#5C5537] font-medium">LinkedIn:</div>
              <a 
                href="https://linkedin.com/company/trackboxd" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[#5C5537] hover:text-[#3E3725] transition-colors duration-200 font-medium"
              >
                Trackboxd
              </a>
            </div>
            
            <div className="flex items-center justify-center space-x-4">
              <div className="text-[#5C5537] font-medium">Email:</div>
              <a 
                href="mailto:trackboxd@gmail.com"
                className="text-[#5C5537] hover:text-[#3E3725] transition-colors duration-200 font-medium"
              >
                trackboxd@gmail.com
              </a>
            </div>
          </div>
        </div>
      </main>
      
      <Footer variant="light" />
    </div>
  );
}