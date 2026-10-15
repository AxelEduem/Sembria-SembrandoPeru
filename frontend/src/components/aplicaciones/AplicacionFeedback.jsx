import FeedbackToast from "@/components/ui/FeedbackToast";

function AplicacionFeedback({ feedback, onClose }) {
  return <FeedbackToast feedback={feedback} onClose={onClose} />;
}

export default AplicacionFeedback;
