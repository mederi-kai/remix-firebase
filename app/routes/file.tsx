import {
  ActionFunction,
  LoaderFunction,
  json,
  redirect,
} from "@remix-run/node";
import { useActionData, useFetcher, useLoaderData } from "@remix-run/react";
import React from "react";
import { db } from "~/firebase.server";
import { checkToken } from "~/libs/token";

export const loader: LoaderFunction = async ({ request }) => {
  const token = await checkToken(request);
  if (!token) throw new Error("ログインしていません");
  const csvDoc = await db.collection("csv").get();
  const data = csvDoc.docs.map((d) => d.data());
  return json({ data });
};

export const action: ActionFunction = async ({ request }) => {
  const token = await checkToken(request);
  if (!token) throw new Error("ログインしていません");

  // ファイルをアップロード
  const formData = await request.formData();
  const file = formData.get("file"); // 'file' は input 要素の name 属性
  if (!file || typeof file !== "string") {
    return json({ error: "ファイルが提供されていません。" }, { status: 400 });
  }

  const data = csvToObj(file);

  const batch = db.batch();
  data.map((d) => {
    batch.set(db.collection("csv").doc(), d);
  });
  await batch.commit();

  // Firestore にデータを追加
  return redirect("/file");
};

function readFileAsString(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      if (!event.target) {
        return reject("no target");
      }
      resolve(event.target.result as string); // 読み込んだ内容を解決値として返す
    };

    reader.onerror = (error) => {
      return reject(error); // エラーが発生した場合は、Promiseを拒否
    };

    reader.readAsText(file); // ファイルの内容をテキストとして読み込む
  });
}

const csvToObj = (csv: string) => {
  // CSVの1行目（ヘッダ）を英語のキーにマッピング
  const headers = [
    "performanceFee",
    "counselorResponse",
    "attendingPhysician",
    "anybotID",
    "consultationStartTime",
    "tags",
    "status",
    "membershipRegistration",
    "questionnaireResponse",
    "reConsultationQuestionnaire",
    "phoneNumber",
    "consultationStyle",
    "toolsUsed",
    "nameKanji",
    "nameKana",
    "consultationRequest",
    "delay",
    "consultationResponse",
    "intermediateDosePrescription",
    "morningAfterPillPrescription",
    "sideEffectMedicationPrescription",
    "CSResponseNeeded",
    "fromDoctorToCS_Counselor",
    "doubleCheck",
    "fromMederiCSToDoctor",
    "fromCounselorToDoctor",
    "age",
    "consentFromParents",
    "medicationExperience",
    "pillsTaken",
    "improvementObjective",
    "desiredPill",
    "questionsForDoctor",
    "reConsultationQuestionsForDoctor",
    "reConsultationChangeRequest",
    "reConsultationSideEffectMedicationRequest",
    "lastMenstruationStartDate",
    "menstrualCycle",
    "datesToAvoidMenstruation",
    "dateOfSexualActivity",
    "desireForPregnancy",
    "pregnancyExperience",
    "pregnancyTerm_NumberOfDeliveries",
    "pregnancy_Delivery_Breastfeeding",
    "diagnosedWithJaundice_Herpes_PersistentPruritusDuringPregnancy",
    "surgeryInTheLastTwoWeeks",
    "migraineWithAura",
    "currentMedications",
    "allergies",
    "height",
    "weight",
    "BMIUnderThirty",
    "diagnosedWithHypertension",
    "smoking",
    "abnormalBleeding",
    "gynecologicalDiseases",
    "otherDiseases",
    "familyHistoryOfThrombosis",
    "familyHistoryOfBreastCancer",
    "identityDocument",
    "bloodTestImage",
  ];

  // CSVのデータ行を分割
  const rows = csv.split("\n").map((row) => row.split(","));

  // ヘッダ行をスキップして、データ行からオブジェクトを生成
  const dataObjects = rows.slice(1).map((row) => {
    const obj: { [key: string]: string } = {};
    row.forEach((value, index) => {
      const keyName = headers[index];
      if (keyName === "nameKanji" || keyName === "nameKana") {
        obj[headers[index]] = "〇〇太郎";
      } else if (keyName === "phoneNumber") {
        obj[headers[index]] = "080-1234-5678";
      } else {
        obj[headers[index]] = value;
      }
    });
    return obj;
  });

  return dataObjects;
};

// ログインされている状態でないとアクセスできないページ
export default function File() {
  const { data } = useLoaderData<typeof loader>();
  const d = useActionData<typeof action>();
  const fetcher = useFetcher();
  const handleSubmit = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      console.error("ファイルが選択されていません。");
      return;
    }
    const formData = new FormData();
    const file = e.target.files[0];
    const csv = await readFileAsString(file);

    formData.append("file", csv);
    // useFetcher を使ってファイルを非同期でアップロード
    fetcher.submit(formData, { method: "post" });
  };
  return (
    <div>
      <p>{JSON.stringify(data)}</p>
      <p>{JSON.stringify(d)}</p>
      <input
        accept="text/csv"
        type="file"
        name="file"
        onChange={handleSubmit}
      />
    </div>
  );
}
