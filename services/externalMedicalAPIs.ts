
import { ClinicalTrial, MedlinePlusResult, DrugLabel, PubMedPaper } from "../types";

const PUBMED_API_KEY = "e77634bf3c12fa7d7a22574e810abf90bb08";

// 1. ClinicalTrials.gov API v2
// Docs: https://clinicaltrials.gov/data-about-studies/web-api-to-access-study-data
export const fetchClinicalTrials = async (condition: string): Promise<ClinicalTrial[]> => {
  try {
    const term = encodeURIComponent(condition);
    // SWITCH TO query.cond (Condition) for better relevance vs query.term
    // Also request 5 recruiting studies.
    const url = `https://clinicaltrials.gov/api/v2/studies?query.cond=${term}&filter.overallStatus=RECRUITING&pageSize=5&fields=NCTId,BriefTitle,OverallStatus,Phases,ConditionsModule`;

    const response = await fetch(url);
    if (!response.ok) throw new Error("ClinicalTrials API failed");
    
    const data = await response.json();
    
    if (!data.studies) return [];

    return data.studies.map((study: any) => ({
      nctId: study.protocolSection?.identificationModule?.nctId || "N/A",
      title: study.protocolSection?.identificationModule?.briefTitle || "Untitled Study",
      status: study.protocolSection?.statusModule?.overallStatus || "Unknown",
      phase: study.protocolSection?.designModule?.phases?.[0] || "Not Applicable",
      conditions: study.protocolSection?.conditionsModule?.conditions || [],
      url: `https://clinicaltrials.gov/study/${study.protocolSection?.identificationModule?.nctId}`
    }));

  } catch (error) {
    console.warn("Failed to fetch clinical trials:", error);
    return [];
  }
};

// 2. MedlinePlus / Health.gov MyHealthfinder API
export const fetchMedlinePlusResources = async (condition: string): Promise<MedlinePlusResult[]> => {
  try {
    const term = encodeURIComponent(condition);
    // Using MyHealthfinder JSON endpoint
    const url = `https://health.gov/myhealthfinder/api/v3/topicsearch.json?keyword=${term}`;

    const response = await fetch(url);
    if (!response.ok) return [];
    
    const data = await response.json();
    
    // The API structure can be nested
    const resources = data.Result?.Resources?.Resource || [];

    return resources.slice(0, 3).map((res: any) => ({
      title: res.Title,
      summary: res.Categories?.split(',')[0] || "Health Topic", 
      url: res.AccessibleVersion || "https://medlineplus.gov/"
    }));

  } catch (error) {
    console.warn("Failed to fetch MedlinePlus/HealthFinder resources:", error);
    return [];
  }
};

// 3. OpenFDA Drug Label API
export const fetchOpenFDADrugs = async (condition: string): Promise<DrugLabel[]> => {
  try {
    // BROADENED SEARCH: Use simple fuzzy matching instead of strict quotes
    // Replace spaces with + but do NOT wrap in quotes to allow fuzzy finding
    const term = condition.trim().replace(/\s+/g, '+');
    
    // Search in indications OR purpose OR description
    // Using limit=5
    const url = `https://api.fda.gov/drug/label.json?search=(indications_and_usage:${term}+OR+purpose:${term}+OR+description:${term})&limit=5`;

    const response = await fetch(url);
    if (!response.ok) return [];

    const data = await response.json();
    
    if (!data.results) return [];

    return data.results.map((drug: any) => ({
      brand_name: drug.openfda?.brand_name?.[0] || drug.openfda?.generic_name?.[0] || "Unknown Brand",
      generic_name: drug.openfda?.generic_name?.[0] || "Unknown Generic",
      substance_name: drug.openfda?.substance_name?.[0] || "",
      pharm_class_epc: drug.openfda?.pharm_class_epc?.[0] || "Unclassified",
      manufacturer_name: drug.openfda?.manufacturer_name?.[0] || "Unknown Manufacturer"
    }));

  } catch (error) {
    console.warn("Failed to fetch OpenFDA drugs:", error);
    return [];
  }
};

// 4. PubMed API (E-Utilities)
// Docs: https://www.ncbi.nlm.nih.gov/books/NBK25501/
export const fetchPubMedPapers = async (condition: string): Promise<PubMedPaper[]> => {
  try {
    const term = encodeURIComponent(condition);
    
    // Step 1: ESearch - Find IDs
    const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${term}&retmax=5&retmode=json&api_key=${PUBMED_API_KEY}`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();
    
    const ids = searchData.esearchresult?.idlist || [];
    if (ids.length === 0) return [];
    
    // Step 2: ESummary - Get Details
    const idString = ids.join(',');
    const summaryUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${idString}&retmode=json&api_key=${PUBMED_API_KEY}`;
    const summaryRes = await fetch(summaryUrl);
    const summaryData = await summaryRes.json();
    
    const result = summaryData.result || {};
    // 'uids' is the list of IDs, we map over them
    const papers = ids.map((uid: string) => {
      const doc = result[uid];
      if (!doc) return null;
      
      return {
        uid: uid,
        title: doc.title || "Untitled Paper",
        source: doc.fulljournalname || doc.source || "Unknown Source",
        pubdate: doc.pubdate || "",
        authors: doc.authors?.map((a: any) => a.name).slice(0, 3) || [],
        url: `https://pubmed.ncbi.nlm.nih.gov/${uid}/`
      };
    }).filter((p: any) => p !== null);
    
    return papers as PubMedPaper[];

  } catch (error) {
    console.warn("Failed to fetch PubMed papers:", error);
    return [];
  }
};
