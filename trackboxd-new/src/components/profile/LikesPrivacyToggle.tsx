'use client';

import { Lock } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface LikesPrivacyToggleProps {
  initialPrivacy: boolean;
}

export default function LikesPrivacyToggle({ initialPrivacy }: LikesPrivacyToggleProps) {
  return (
    <div className="flex items-center space-x-2">
      <Checkbox 
        id="likes-privacy" 
        checked={initialPrivacy}
        onCheckedChange={async (checked) => {
          try {
            const response = await fetch('/api/profile/update/likes-privacy', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ isPrivate: !!checked })
            });
            if (!response.ok) throw new Error('Failed to update privacy setting');
            // Refresh the page to show updated state
            window.location.reload();
          } catch (error) {
            console.error('Error updating likes privacy:', error);
          }
        }}
        className="border-[#5C5537]/50 data-[state=checked]:bg-[#5C5537] data-[state=checked]:border-[#5C5537]"
      />
      <div className="flex items-center gap-1.5">
        <Lock className="h-4 w-4 text-[#5C5537]" />
        <label 
          htmlFor="likes-privacy" 
          className="text-sm font-medium leading-none text-[#5C5537] cursor-pointer"
        >
          Make likes private
        </label>
      </div>
    </div>
  );
}