import { useEffect, useState } from "react";
import { db, auth } from "../api/Firebase";
import { doc, onSnapshot } from "firebase/firestore";

export const useLicenseGuard = () => {
  const [isLicenseValid, setIsLicenseValid] = useState(true);
  const [loadingLicense, setLoadingLicense] = useState(true);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setLoadingLicense(false);
      return;
    }

    const docRef = doc(db, "usuarios", user.uid);

    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const validade = data.validadeLicenca?.toDate();
        const hoje = new Date();

        // Bloqueia se a data expirou ou o status for 'bloqueado'
        if (
          (validade && hoje > validade) ||
          data.statusLicenca === "bloqueado"
        ) {
          setIsLicenseValid(false);
        } else {
          setIsLicenseValid(true);
        }
      }
      setLoadingLicense(false);
    });

    return () => unsubscribe();
  }, []);

  return { isLicenseValid, loadingLicense };
};
