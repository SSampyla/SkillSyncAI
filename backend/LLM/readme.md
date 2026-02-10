
# Tekoäly moduulin asentaminen. 
Navigoi backend kansioon ja suorita:
    npm install openai

Aja backendiä  (kansiossa backend) komennolla:
    node index.js

Pitäisi avautua porttiin 3000 tai mikä onkaan määritelty .env tiedostossa

----------------------------------------------------------------------------
# Testaaminen PowerShellillä
----------------------------------------------------------------------------

# 1. LIITÄ TEKSTIT TÄHÄN
$jobText = @"
[Liitä työpaikkailmoitus tähän]
"@

$applicantText = @"
[Liitä hakijan CV/profiili tähän]
"@

$portfolioText = @"
[Liitä portfolio tähän]
"@


# 2. TESTAA /SUMMARY (Vain jobText)
$summaryBody = @{ jobText = $jobText } | ConvertTo-Json
$resSummary = Invoke-RestMethod -Uri "http://localhost:3000/api/jobs/summary" -Method POST -Body $summaryBody -ContentType "application/json; charset=utf-8"
$resSummary.summary | Format-List


# 3. TESTAA /SKILLS/JOB (Vain jobText)
$skillsBodyJob = @{ jobText = $jobText } | ConvertTo-Json
$resSkillsJob = Invoke-RestMethod -Uri "http://localhost:3000/api/jobs/skills/job" -Method POST -Body $skillsBodyJob -ContentType "application/json; charset=utf-8"
$resSkillsJob.skills | Format-List


# 4. TESTAA /LETTER (Molemmat tekstit)
$letterBody = @{ 
    jobText = $jobText
    applicantText = $applicantText 
    language = "Finnish"
} | ConvertTo-Json

$resLetter = Invoke-RestMethod -Uri "http://localhost:3000/api/jobs/letter" -Method POST -Body $letterBody -ContentType "application/json; charset=utf-8"
$resLetter.coverLetter

# 5. TESTAA /SKILLS/APPLICANT
$skillsBodyApplicant = @{ applicantText = $applicantText } | ConvertTo-Json
$resSkillsApplicant = Invoke-RestMethod -Uri "http://localhost:3000/api/jobs/skills/applicant" -Method POST -Body $skillsBodyApplicant -ContentType "application/json; charset=utf-8"
$resSkillsApplicant.skills | Format-List

# 6. TESTAA /API/PORTFOLIO/ANALYSIS  (Huom, powerShell ei osaa ainakaan helposti avata System.Object[] jonka tämä palauttaa tällä hetkellä. Tulosta vastaus vaikka noden lokiin portfolioAnalysis.js tiedostossa)
$portfolioBody = @{ portfolioText = $portfolioText } | ConvertTo-Json
$resPortfolio = Invoke-RestMethod -Uri "http://localhost:3000/api/portfolio/analysis" -Method POST -Body $portfolioBody -ContentType "application/json; charset=utf-8"
$resPortfolio.summary | Format-List

## Jos vastaukset ei aukea, Tarkista vastauksen kaikki kentät Get-Member komennolla. 
$resSummary | Get-Member 
$resSkillsJob | Get-Member
$resLetter | Get-Member
$resSkillsApplicant | Get-Member
$resPortfolio | Get-Member

----------------------------------------------------------------------------
# Esimerkkivastaus POST /api/jobs/summary

Pitäisi olla muotoa: 
{
  "summary": "short 2-3 sentence overview",
  "technologies": [],
  "hardSkills": [],
  "softSkills": [],
  "otherRelevantInfo": {
    "salary": null,
    "location": null,
    "remote": null,
    "employmentType": null
  }
}

----------------------------------------------------------------------------
# Esimerkkivastaus POST /api/jobs/skills

Pitäisi olla muotoa:
{
  "hardSkillsRequired": [],
  "hardSkillsOptional": [],
  "softSkillsRequired": [],
  "softSkillsOptional": []
}

Mallin palauttamaa dataa:
{
  "hardSkillsRequired": [
    "TypeScript",
    "Node.js",
    "React",
    "modernit web-teknologiat",
    "ohjelmointi",
    "ohjelmistotestaus",
    "modernit kehitystyökalut",
    "Agile-ohjelmistokehitys",
    "pilviteknologiat",
    "englannin kieli"
  ],
  "hardSkillsOptional": [
    "Azure",
    "AWS",
    "GCP",
    "suomen kieli",
    "GitHub",
    "henkilökohtaiset projektit",
    "harrasteprojektit"
  ],
  "softSkillsRequired": [
    "itseohjautuvuus",
    "aloitteellisuus",
    "tiimityöskentely",
    "ongelmanratkaisu"
  ],
  "softSkillsOptional": [
    "viestintätaidot"
  ]
}

----------------------------------------------------------------------------
# Esimerkkivastaus POST /api/jobs/letter
- AI on ohjeistettu jättämään nimi tyhjäksi, jos se ei tiedä sitä. Voidaan muuttaa jos tarve.

Pitäisi olla muotoa:
{ 
  "coverLetter": "..." 
}

----------------------------------------------------------------------------