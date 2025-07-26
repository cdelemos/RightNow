#!/usr/bin/env python3
"""
Populate the database with comprehensive real-world legal statutes
covering housing, employment, consumer protection, criminal law, civil rights, education, and more.
"""

import requests
import json

BACKEND_URL = "https://d41d4daa-9cdd-4f1d-8312-f7c9237f7509.preview.emergentagent.com/api"

# Login as admin user
login_data = {
    "email": "sarah.johnson@university.edu",
    "password": "SecurePass123!"
}

response = requests.post(f"{BACKEND_URL}/auth/login", json=login_data)
if response.status_code != 200:
    print("Failed to login")
    exit(1)

token = response.json()["data"]["access_token"]
headers = {"Authorization": f"Bearer {token}"}

# Comprehensive real-world legal statutes
statutes = [
    # Housing Laws
    {
        "title": "Fair Housing Act - Discrimination Protection",
        "statute_number": "42 USC 3601-3619",
        "state": "Federal",
        "category": "housing",
        "summary": "Prohibits discrimination in housing based on race, color, religion, sex, national origin, familial status, or disability",
        "full_text": "The Fair Housing Act prohibits discrimination in the sale, rental, and financing of dwellings, and in other housing-related transactions, based on race, color, national origin, religion, sex, familial status (including children under the age of 18 living with parents or legal custodians, pregnant women, and people securing custody of children under the age of 18), and handicap (disability).",
        "keywords": ["housing discrimination", "fair housing", "rental rights", "disability accommodation"],
        "practical_impact": "Protects tenants and homebuyers from discriminatory practices by landlords, sellers, and lenders",
        "student_relevance": "Essential for students seeking housing who may face discrimination based on age, family status, or other protected characteristics"
    },
    {
        "title": "California Tenant Protection Act",
        "statute_number": "CA Civil Code 1946.2",
        "state": "California",
        "category": "housing",
        "summary": "Provides rent control and just cause eviction protections for tenants in California",
        "full_text": "The Tenant Protection Act of 2019 establishes statewide rent control and just cause eviction protections. It limits annual rent increases to 5% plus inflation (capped at 10%) and requires landlords to have just cause to terminate tenancies after 12 months.",
        "keywords": ["rent control", "eviction protection", "tenant rights", "just cause"],
        "practical_impact": "Limits rent increases and provides eviction protection for most California tenants",
        "student_relevance": "Crucial for students renting in California to understand their rights against excessive rent increases and wrongful evictions"
    },
    {
        "title": "Security Deposit Laws",
        "statute_number": "CA Civil Code 1950.5",
        "state": "California",
        "category": "housing",
        "summary": "Regulates security deposits for residential rentals, including limits and return requirements",
        "full_text": "California law limits security deposits to two months' rent for unfurnished units and three months' rent for furnished units. Landlords must return deposits within 21 days after tenancy ends, with itemized deductions for damages beyond normal wear and tear.",
        "keywords": ["security deposit", "rental deposit", "tenant rights", "normal wear and tear"],
        "practical_impact": "Protects tenants from excessive deposits and ensures timely return of deposits",
        "student_relevance": "Important for students to know their rights regarding security deposits when renting apartments or dorms"
    },

    # Employment Laws
    {
        "title": "Fair Labor Standards Act",
        "statute_number": "29 USC 201-219",
        "state": "Federal",
        "category": "employment",
        "summary": "Establishes minimum wage, overtime pay, recordkeeping, and youth employment standards",
        "full_text": "The Fair Labor Standards Act (FLSA) establishes minimum wage, overtime pay eligibility, recordkeeping, and child labor standards affecting employees in the private sector and in Federal, State, and local governments. Covered nonexempt workers are entitled to a minimum wage of not less than $7.25 per hour effective July 24, 2009. Overtime pay at a rate not less than one and one-half times the regular rate of pay is required after 40 hours of work in a workweek.",
        "keywords": ["minimum wage", "overtime pay", "40 hours", "employment standards"],
        "practical_impact": "Ensures workers receive fair compensation for their labor and limits exploitation",
        "student_relevance": "Critical for students working part-time jobs to understand their wage and hour rights"
    },
    {
        "title": "California Paid Sick Leave Act",
        "statute_number": "CA Labor Code 245-249",
        "state": "California",
        "category": "employment",
        "summary": "Requires employers to provide paid sick leave to employees",
        "full_text": "California's Healthy Workplaces, Healthy Families Act requires employers to provide paid sick leave to employees. Employees accrue at least one hour of paid sick leave for every 30 hours worked, up to 48 hours or 6 days per year. Sick leave can be used for the employee's own health condition, care of family members, or domestic violence situations.",
        "keywords": ["paid sick leave", "health benefits", "family care", "accrual"],
        "practical_impact": "Ensures workers can take time off for health needs without losing pay",
        "student_relevance": "Important for student workers to know they're entitled to paid sick leave even in part-time positions"
    },

    # Consumer Protection
    {
        "title": "California Consumer Privacy Act (CCPA)",
        "statute_number": "CA Civil Code 1798.100-1798.150",
        "state": "California",
        "category": "consumer_protection",
        "summary": "Comprehensive privacy law giving California residents rights over their personal information",
        "full_text": "The California Consumer Privacy Act (CCPA) gives consumers more control over the personal information that businesses collect about them. This landmark law secures new privacy rights for California consumers, including: The right to know about the personal information a business collects about them and how it is used and shared; The right to delete personal information collected from them (with some exceptions); The right to opt-out of the sale of their personal information; and The right to non-discrimination for exercising their CCPA rights.",
        "keywords": ["privacy", "consumer rights", "personal information", "data protection"],
        "practical_impact": "Gives consumers control over how businesses use their personal data",
        "student_relevance": "Essential for students to understand their digital privacy rights in the age of social media and online services"
    },
    {
        "title": "Truth in Lending Act",
        "statute_number": "15 USC 1601-1667f",
        "state": "Federal",
        "category": "consumer_protection",
        "summary": "Requires lenders to disclose credit terms and costs to consumers",
        "full_text": "The Truth in Lending Act (TILA) is designed to protect consumers in credit transactions by requiring clear disclosure of key terms of the lending arrangement and all costs. TILA also gives consumers the right to cancel certain credit transactions that involve a lien on a consumer's principal dwelling, regulates certain credit card practices, and provides a means for fair and timely resolution of credit billing disputes.",
        "keywords": ["credit disclosure", "lending terms", "consumer credit", "billing disputes"],
        "practical_impact": "Protects consumers from predatory lending and ensures transparent credit terms",
        "student_relevance": "Crucial for students taking out loans or using credit cards to understand their rights and obligations"
    },

    # Criminal Law
    {
        "title": "Miranda Rights Requirements",
        "statute_number": "Miranda v. Arizona, 384 U.S. 436",
        "state": "Federal",
        "category": "criminal_law",
        "summary": "Requires police to inform suspects of their constitutional rights before custodial interrogation",
        "full_text": "The Miranda decision requires that suspects be informed of their rights before custodial interrogation. These rights include: the right to remain silent, that anything said can be used against them in court, the right to an attorney, and that an attorney will be appointed if they cannot afford one. Failure to provide Miranda warnings can result in suppression of statements made during interrogation.",
        "keywords": ["miranda rights", "custodial interrogation", "right to remain silent", "right to attorney"],
        "practical_impact": "Protects individuals from self-incrimination during police questioning",
        "student_relevance": "Important for students to know their rights if questioned by police"
    },
    {
        "title": "Fourth Amendment Search and Seizure",
        "statute_number": "U.S. Constitution Amendment IV",
        "state": "Federal",
        "category": "criminal_law",
        "summary": "Protects against unreasonable searches and seizures by government",
        "full_text": "The Fourth Amendment protects people from unreasonable searches and seizures by the government. It requires warrants to be judicially sanctioned and supported by probable cause. The amendment applies to searches of homes, vehicles, personal effects, and electronic devices. There are several exceptions including consent, exigent circumstances, and searches incident to arrest.",
        "keywords": ["search warrant", "probable cause", "unreasonable search", "privacy rights"],
        "practical_impact": "Limits government's ability to search private property without justification",
        "student_relevance": "Essential for students to understand their privacy rights, especially in dorms and during traffic stops"
    },

    # Civil Rights
    {
        "title": "Americans with Disabilities Act",
        "statute_number": "42 USC 12101-12213",
        "state": "Federal",
        "category": "civil_rights",
        "summary": "Prohibits discrimination based on disability in employment, public accommodations, and services",
        "full_text": "The Americans with Disabilities Act (ADA) is a comprehensive civil rights law that prohibits discrimination based on disability. It affords similar protections against discrimination to Americans with disabilities as the Civil Rights Act of 1964, which made discrimination based on race, religion, sex, national origin, and other characteristics illegal. The ADA covers employment, public accommodations, transportation, and telecommunications.",
        "keywords": ["disability rights", "reasonable accommodation", "accessibility", "discrimination"],
        "practical_impact": "Ensures equal access and opportunity for people with disabilities",
        "student_relevance": "Important for students with disabilities to know their rights to accommodations in education and employment"
    },
    {
        "title": "Title IX Education Amendments",
        "statute_number": "20 USC 1681-1688",
        "state": "Federal",
        "category": "civil_rights",
        "summary": "Prohibits sex-based discrimination in education programs and activities",
        "full_text": "Title IX states that 'No person in the United States shall, on the basis of sex, be excluded from participation in, be denied the benefits of, or be subjected to discrimination under any education program or activity receiving Federal financial assistance.' This includes protection from sexual harassment and sexual violence in educational settings.",
        "keywords": ["sex discrimination", "education rights", "sexual harassment", "gender equality"],
        "practical_impact": "Protects students from sex-based discrimination and harassment in educational settings",
        "student_relevance": "Crucial for all students to understand their rights to equal treatment and protection from harassment"
    },

    # Education Law
    {
        "title": "Family Educational Rights and Privacy Act (FERPA)",
        "statute_number": "20 USC 1232g",
        "state": "Federal",
        "category": "education",
        "summary": "Protects the privacy of student education records",
        "full_text": "FERPA gives parents certain rights with respect to their children's education records. These rights transfer to the student when he or she reaches the age of 18 or attends a school beyond the high school level. Students have the right to inspect and review their education records, request amendment of records they believe are inaccurate, and control disclosure of personally identifiable information from their records.",
        "keywords": ["student privacy", "education records", "FERPA rights", "academic records"],
        "practical_impact": "Protects student academic and disciplinary records from unauthorized disclosure",
        "student_relevance": "Essential for students to understand their privacy rights regarding academic records"
    },

    # Traffic Law
    {
        "title": "Implied Consent Laws",
        "statute_number": "CA Vehicle Code 23612",
        "state": "California",
        "category": "traffic",
        "summary": "Requires drivers to submit to chemical testing when arrested for DUI",
        "full_text": "California's implied consent law means that by driving in California, you have given your consent to chemical testing of your blood, breath, or urine if arrested for DUI. Refusal to submit to testing results in automatic license suspension and can be used as evidence against you in court. The law applies to all drivers, including those with out-of-state licenses.",
        "keywords": ["implied consent", "DUI testing", "license suspension", "chemical testing"],
        "practical_impact": "Requires drivers to submit to sobriety testing or face automatic penalties",
        "student_relevance": "Important for student drivers to understand the consequences of DUI arrests and testing refusal"
    },

    # Contract Law
    {
        "title": "Statute of Frauds",
        "statute_number": "CA Civil Code 1624",
        "state": "California",
        "category": "contracts",
        "summary": "Requires certain contracts to be in writing to be enforceable",
        "full_text": "The Statute of Frauds requires certain types of contracts to be in writing and signed to be legally enforceable. These include contracts for the sale of real estate, contracts that cannot be performed within one year, contracts for the sale of goods over $500, and contracts to answer for the debt of another. The writing must contain the essential terms of the agreement.",
        "keywords": ["written contract", "contract enforceability", "real estate", "statute of frauds"],
        "practical_impact": "Protects parties from fraudulent claims about oral agreements",
        "student_relevance": "Important for students entering into significant contracts like leases or employment agreements"
    }
]

print("Populating database with comprehensive legal statutes...")

created_count = 0
for statute in statutes:
    response = requests.post(f"{BACKEND_URL}/statutes", json=statute, headers=headers)
    if response.status_code == 200:
        created_count += 1
        print(f"✅ Created: {statute['title']}")
    else:
        print(f"❌ Failed to create: {statute['title']} - {response.status_code}")

print(f"\n📊 Successfully created {created_count} out of {len(statutes)} statutes")
print("Database population complete!")