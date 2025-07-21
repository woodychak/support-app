// components/delete-staff-form.tsx

import { deleteStaffAccountAction } from "@/app/actions";
import { Button } from "@/components/ui/button";

interface Props {
  staffId: string;
  currentUserId: string;
}

export function DeleteStaffForm({ staffId, currentUserId }: Props) {
  return (
    <form action={deleteStaffAccountAction}>
      <input type="hidden" name="staff_id" value={staffId} />
      <input type="hidden" name="current_user_id" value={currentUserId} />
      <Button type="submit" variant="destructive">
        Delete
      </Button>
    </form>
  );
}
