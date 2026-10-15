import FeedbackToast from "@/components/ui/FeedbackToast";

function CargoFeedback({ feedback, onClose }) {
  return <FeedbackToast feedback={feedback} onClose={onClose} />;
}

export default CargoFeedback;
