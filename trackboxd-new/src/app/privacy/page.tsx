import Footer from "@/components/Footer";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#FFFBEb] flex flex-col">
      <main className="flex-1 px-6 py-16">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-[#5C5537] mb-8 text-center">
            Privacy Policy
          </h1>
          
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-semibold text-[#5C5537] mb-3">Data Collection</h2>
              <p className="text-[#5C5537]/80 leading-relaxed">
                We collect only the information necessary to provide our music tracking and social features. 
                This includes your profile information, music preferences, and activity on the platform.
              </p>
            </div>
            
            <div>
              <h2 className="text-xl font-semibold text-[#5C5537] mb-3">Data Usage</h2>
              <p className="text-[#5C5537]/80 leading-relaxed">
                Your data is used to personalize your experience, provide music recommendations, 
                and enable social features. We do not sell your personal information to third parties.
              </p>
            </div>
            
            <div>
              <h2 className="text-xl font-semibold text-[#5C5537] mb-3">Contact</h2>
              <p className="text-[#5C5537]/80 leading-relaxed">
                If you have any questions about this privacy policy, please contact us at trackboxd@gmail.com.
              </p>
            </div>
          </div>
        </div>
      </main>
      
      <Footer variant="light" />
    </div>
  );
}