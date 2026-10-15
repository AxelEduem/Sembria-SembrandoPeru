import FeedbackToast from "@/components/ui/FeedbackToast";

function AreaFeedback({ feedback, onClose }) {
  return <FeedbackToast feedback={feedback} onClose={onClose} />;
}

export default AreaFeedback;
