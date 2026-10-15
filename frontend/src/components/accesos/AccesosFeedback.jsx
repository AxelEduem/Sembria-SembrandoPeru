import FeedbackToast from "@/components/ui/FeedbackToast";

function AccesosFeedback({ feedback, onClose }) {
  return <FeedbackToast feedback={feedback} onClose={onClose} />;
}

export default AccesosFeedback;
