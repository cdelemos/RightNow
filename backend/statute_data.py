"""
Sample Legal Statute Data for RightNow Platform
Focus on laws that commonly affect college students and general public
"""

SAMPLE_STATUTES = [
    # Housing Rights
    {
        "title": "Fair Housing Act - Discrimination Protection",
        "statute_number": "42 U.S.C. § 3604",
        "state": "Federal",
        "category": "housing",
        "summary": "Prohibits discrimination in housing based on race, color, religion, sex, national origin, familial status, or disability.",
        "full_text": "It shall be unlawful for any person or other entity whose business includes engaging in residential real estate-related transactions to discriminate against any person in making available such a transaction, or in the terms or conditions of such a transaction, because of race, color, religion, sex, handicap, familial status, or national origin.",
        "keywords": ["housing", "discrimination", "fair housing", "rental", "landlord", "tenant"],
        "practical_impact": "Protects renters and homebuyers from discrimination. If you're denied housing based on protected characteristics, this law provides legal recourse.",
        "student_relevance": "Critical for college students seeking off-campus housing or dealing with discriminatory landlords."
    },
    {
        "title": "Security Deposit Return Requirements",
        "statute_number": "Cal. Civ. Code § 1950.5",
        "state": "California",
        "category": "housing",
        "summary": "Landlords must return security deposits within 21 days, with itemized deductions for damages beyond normal wear and tear.",
        "full_text": "Upon termination of the tenancy, any money collected by the landlord as security shall be returned to the tenant within twenty-one (21) days after the tenant has vacated the premises, together with interest if required, less any lawful deductions.",
        "keywords": ["security deposit", "tenant rights", "landlord", "rental", "damages"],
        "practical_impact": "Ensures tenants get their deposits back promptly. Landlords who violate this can face penalties up to twice the deposit amount.",
        "student_relevance": "Essential for students moving out of apartments - know your rights to get your deposit back!"
    },

    # Employment Law
    {
        "title": "Minimum Wage Standards",
        "statute_number": "29 U.S.C. § 206",
        "state": "Federal",
        "category": "employment",
        "summary": "Establishes federal minimum wage requirements for covered employees.",
        "full_text": "Every employer shall pay to each of his employees who in any workweek is engaged in commerce or in the production of goods for commerce, or is employed in an enterprise engaged in commerce or in the production of goods for commerce, wages at rates not less than $7.25 an hour.",
        "keywords": ["minimum wage", "employment", "wages", "labor", "workers rights"],
        "practical_impact": "Guarantees minimum hourly pay. Many states have higher minimum wages that override federal standards.",
        "student_relevance": "Know your rights as a student worker - you're entitled to at least minimum wage for your work."
    },
    {
        "title": "Overtime Pay Requirements", 
        "statute_number": "29 U.S.C. § 207",
        "state": "Federal",
        "category": "employment",
        "summary": "Requires overtime pay at 1.5x regular rate for hours worked over 40 per week.",
        "full_text": "No employer shall employ any of his employees who in any workweek is engaged in commerce or in the production of goods for commerce, or is employed in an enterprise engaged in commerce or in the production of goods for commerce, for a workweek longer than forty hours unless such employee receives compensation for his employment in excess of the hours above specified at a rate not less than one and one-half times the regular rate at which he is employed.",
        "keywords": ["overtime", "wages", "employment", "40 hours", "time and a half"],
        "practical_impact": "If you work more than 40 hours per week, you must be paid overtime unless you're exempt (like salary employees over certain thresholds).",
        "student_relevance": "Important for students with part-time jobs - know when you're entitled to overtime pay."
    },

    # Consumer Protection
    {
        "title": "Credit Card Accountability Act - Student Protections",
        "statute_number": "15 U.S.C. § 1637",
        "state": "Federal", 
        "category": "consumer_protection",
        "summary": "Restricts credit card marketing to students under 21 and requires co-signers or proof of income.",
        "full_text": "No card issuer may open a credit card account for a consumer who has not attained the age of 21 years, unless the consumer has submitted a written application that meets the requirements of subsection (c), and the card issuer has obtained independent means to repay the debt obligations or has obtained a written agreement to pay such debt by a co-signer who has attained the age of 21 years.",
        "keywords": ["credit card", "students", "under 21", "co-signer", "debt"],
        "practical_impact": "Protects young adults from predatory credit card practices. Students under 21 need co-signers or proven income to get credit cards.",
        "student_relevance": "Essential knowledge for college students dealing with credit card offers and building credit responsibly."
    },
    {
        "title": "Truth in Lending Act - Disclosure Requirements",
        "statute_number": "15 U.S.C. § 1601",
        "state": "Federal",
        "category": "consumer_protection", 
        "summary": "Requires lenders to disclose all terms, costs, and conditions of loans and credit agreements.",
        "full_text": "It is the purpose of this subchapter to assure a meaningful disclosure of credit terms so that the consumer will be able to compare more readily the various credit terms available to him and avoid the uninformed use of credit.",
        "keywords": ["lending", "disclosure", "credit terms", "loans", "APR"],
        "practical_impact": "Ensures transparency in lending. Lenders must clearly state interest rates, fees, and terms before you sign any credit agreement.",
        "student_relevance": "Critical for student loans, credit cards, and any financing - know what you're signing up for!"
    },

    # Criminal Law / Civil Rights  
    {
        "title": "Miranda Rights - Protection Against Self-Incrimination",
        "statute_number": "Miranda v. Arizona (1966)",
        "state": "Federal",
        "category": "criminal_law",
        "summary": "Police must inform suspects of their rights before custodial interrogation, including the right to remain silent and right to an attorney.",
        "full_text": "The person in custody must, prior to interrogation, be clearly informed that he has the right to remain silent, and that anything he says will be used against him in court; he must be clearly informed that he has the right to consult with a lawyer and to have the lawyer with him during interrogation.",
        "keywords": ["miranda rights", "police", "interrogation", "right to remain silent", "attorney"],
        "practical_impact": "If arrested, police must read you your rights before questioning. If they don't, statements you made may not be used in court.",
        "student_relevance": "Know your rights during police encounters - you have the right to remain silent and request a lawyer."
    },
    {
        "title": "Fourth Amendment - Search and Seizure Protection",
        "statute_number": "U.S. Constitution Amendment IV",
        "state": "Federal",
        "category": "civil_rights",
        "summary": "Protects against unreasonable searches and seizures; generally requires warrants based on probable cause.",
        "full_text": "The right of the people to be secure in their persons, houses, papers, and effects, against unreasonable searches and seizures, shall not be violated, and no Warrants shall issue, but upon probable cause, supported by Oath or affirmation, and particularly describing the place to be searched, and the persons or things to be seized.",
        "keywords": ["fourth amendment", "search", "seizure", "warrant", "probable cause", "privacy"],
        "practical_impact": "Police generally need a warrant to search your home, car, or belongings. There are exceptions, but this is your core protection against unreasonable searches.",
        "student_relevance": "Essential for understanding your rights during police encounters, especially in dorm rooms or during traffic stops."
    },

    # Education Law
    {
        "title": "Family Educational Rights and Privacy Act (FERPA)",
        "statute_number": "20 U.S.C. § 1232g",
        "state": "Federal",
        "category": "education",
        "summary": "Protects the privacy of student education records and gives students control over disclosure of their information.",
        "full_text": "No funds shall be made available under any applicable program to any educational agency or institution which has a policy or practice of permitting the release of education records (or personally identifiable information contained therein other than directory information) of students without the written consent of their parents.",
        "keywords": ["FERPA", "privacy", "education records", "student rights", "transcript"],
        "practical_impact": "Your educational records are private. Schools need your permission to share grades, disciplinary records, or other educational information with third parties.",
        "student_relevance": "Protects your academic privacy - know who can access your educational information and when."
    },
    {
        "title": "Title IX - Sex Discrimination in Education",
        "statute_number": "20 U.S.C. § 1681",
        "state": "Federal", 
        "category": "education",
        "summary": "Prohibits sex-based discrimination in any education program or activity receiving federal funding.",
        "full_text": "No person in the United States shall, on the basis of sex, be excluded from participation in, be denied the benefits of, or be subjected to discrimination under any education program or activity receiving Federal financial assistance.",
        "keywords": ["title ix", "sex discrimination", "sexual harassment", "education", "gender equity"],
        "practical_impact": "Protects against sexual harassment and discrimination in schools. Colleges must investigate and address Title IX violations.",
        "student_relevance": "Critical protection against sexual harassment and discrimination on campus - know your rights and reporting procedures."
    },

    # Traffic/Transportation
    {
        "title": "Implied Consent Law - DUI Testing",
        "statute_number": "Cal. Veh. Code § 23612",
        "state": "California",
        "category": "traffic",
        "summary": "By driving in California, you consent to chemical testing if arrested for DUI. Refusal results in automatic license suspension.",
        "full_text": "A person who drives a motor vehicle is deemed to have given his or her consent to chemical testing of his or her blood or breath for the purpose of determining the alcoholic content of his or her blood, if lawfully arrested for an offense allegedly committed in violation of Section 23140, 23152, or 23153.",
        "keywords": ["implied consent", "DUI", "breathalyzer", "blood test", "license suspension"],
        "practical_impact": "Refusing a breathalyzer or blood test when arrested for DUI results in automatic license suspension, separate from any DUI penalties.",
        "student_relevance": "Important for college students to understand the consequences of DUI arrests and testing refusal."
    },

    # Contract Law
    {
        "title": "Statute of Frauds - Written Contract Requirements",
        "statute_number": "Cal. Civ. Code § 1624",
        "state": "California",
        "category": "contracts",
        "summary": "Certain contracts must be in writing to be enforceable, including real estate transactions and contracts lasting over one year.",
        "full_text": "The following contracts are invalid, unless they, or some note or memorandum thereof, are in writing and subscribed by the party to be charged or by the party's agent: (a) An agreement that by its terms is not to be performed within a year from the making thereof. (b) A special promise to answer for the debt, default, or miscarriage of another...",
        "keywords": ["statute of frauds", "written contract", "real estate", "one year", "enforceable"],
        "practical_impact": "Some agreements must be written to be legally binding. Verbal promises for real estate, long-term contracts, or guaranteeing someone else's debt may not be enforceable.",
        "student_relevance": "Important when signing leases, employment contracts, or other major agreements - know when you need it in writing."
    },

    # Additional State-Specific Examples
    {
        "title": "Right to Organize and Collective Bargaining",
        "statute_number": "29 U.S.C. § 157",
        "state": "Federal",
        "category": "employment",
        "summary": "Protects employees' rights to form unions, engage in collective bargaining, and participate in other protected activities.",
        "full_text": "Employees shall have the right to self-organization, to form, join, or assist labor organizations, to bargain collectively through representatives of their own choosing, and to engage in other concerted activities for the purpose of collective bargaining or other mutual aid or protection.",
        "keywords": ["union", "collective bargaining", "labor rights", "organizing", "protected activity"],
        "practical_impact": "You have the right to join unions and engage in collective action. Employers cannot retaliate against you for union activities.",
        "student_relevance": "Relevant for student workers, graduate assistants, and understanding workplace rights in general."
    },
    {
        "title": "Lemon Law - Defective Vehicle Protection",
        "statute_number": "Cal. Civ. Code § 1793.2",
        "state": "California", 
        "category": "consumer_protection",
        "summary": "Provides remedies for consumers who purchase defective vehicles that cannot be adequately repaired.",
        "full_text": "If the manufacturer or its representative in this state does not service or repair the goods to conform to the applicable express warranties after a reasonable number of attempts, the manufacturer shall either replace the goods or reimburse the buyer in an amount equal to the purchase price paid by the buyer.",
        "keywords": ["lemon law", "defective vehicle", "warranty", "replacement", "refund"],
        "practical_impact": "If your new car has repeated problems that can't be fixed, you may be entitled to a replacement or refund under lemon laws.",
        "student_relevance": "Important for students buying their first car - know your rights if you get a defective vehicle."
    }
]