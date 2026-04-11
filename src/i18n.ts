import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      "dashboard": "Dashboard",
      "predict_bail": "Predict Bail",
      "cases": "Cases",
      "bias_audit": "Bias Audit",
      "language": "Language",
      "welcome": "Welcome to BailPredict",
      "app_name": "BailPredict"
    }
  },
  hi: {
    translation: {
      "dashboard": "डैशबोर्ड",
      "predict_bail": "जमानत भविष्यवाणी",
      "cases": "मामले",
      "bias_audit": "पूर्वाग्रह ऑडिट",
      "language": "भाषा",
      "welcome": "BailPredict में आपका स्वागत है",
      "app_name": "BailPredict"
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "en",
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
