"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.R_CODES = exports.VARIOUS_RESTORATIONS = exports.BRIDGEWORK = exports.INLAYS_AND_CROWNS = void 0;
// Section R - Crowns and Bridges (Kronen en bruggen)
// All prices in this section include emergency provisions where applicable
// A. Inlays and Crowns (Inlays en kronen)
exports.INLAYS_AND_CROWNS = [
    {
        code: 'R08',
        description: 'Eénvlaks composiet inlay',
        points: 12,
        rate: 91.04,
        explanation: 'Vervaardiging, napolymerisatie buiten de mond en plaatsing in dezelfde zitting, inclusief etsen.',
        requiresTeethNumbers: true,
        requiresSurfaceNumbers: true,
        maxSurfaces: 1
    },
    {
        code: 'R09',
        description: 'Tweevlaks composiet inlay',
        points: 23,
        rate: 174.49,
        explanation: 'Vervaardiging, napolymerisatie buiten de mond en plaatsing in dezelfde zitting, inclusief etsen.',
        requiresTeethNumbers: true,
        requiresSurfaceNumbers: true,
        maxSurfaces: 2
    },
    {
        code: 'R10',
        description: 'Drievlaks composiet inlay',
        points: 30,
        rate: 227.59,
        explanation: 'Vervaardiging, napolymerisatie buiten de mond en plaatsing in dezelfde zitting, inclusief etsen.',
        requiresTeethNumbers: true,
        requiresSurfaceNumbers: true,
        maxSurfaces: 3
    },
    {
        code: 'R11',
        description: 'Eénvlaksinlay',
        points: 18,
        rate: 136.56,
        explanation: 'Van gegoten metaal, kunststof of (glas-) keramiek, inclusief noodvoorziening.',
        requiresTeethNumbers: true,
        requiresSurfaceNumbers: true,
        maxSurfaces: 1
    },
    {
        code: 'R12',
        description: 'Tweevlaksinlay',
        points: 28,
        rate: 212.42,
        explanation: 'Van gegoten metaal, kunststof of (glas-) keramiek, inclusief noodvoorziening.',
        requiresTeethNumbers: true,
        requiresSurfaceNumbers: true,
        maxSurfaces: 2
    },
    {
        code: 'R13',
        description: 'Drievlaksinlay',
        points: 40,
        rate: 303.46,
        explanation: 'Van gegoten metaal, kunststof of (glas-) keramiek, inclusief noodvoorziening.',
        requiresTeethNumbers: true,
        requiresSurfaceNumbers: true,
        maxSurfaces: 3
    },
    {
        code: 'R14',
        description: 'Toeslag voor extra retentie bij het plaatsen van indirecte restauraties',
        points: 5,
        rate: 37.93,
        explanation: 'Toeslag voor extra retentie zoals aanvullende hechttechniek of een aangegoten pin bij het plaatsen van indirecte restauraties. Cementeren van indirect vervaardigde restauratie na toepassing van ten minste drie van de volgende hulpmiddelen: zandstralen met specifieke straalpoeders, silaniseervloeistof, porceleinetsvloeistof, composietcement, het aanbrengen van dentine hechtlak na preparatie.',
        requiresTeethNumbers: true,
        validWithCodes: ['R08', 'R09', 'R10', 'R11', 'R12', 'R13', 'R24', 'R34', 'R32', 'R33', 'R60', 'R61', 'R71', 'R74', 'R75', 'R79']
    },
    {
        code: 'R24',
        description: 'Kroon op natuurlijk element',
        points: 44,
        rate: 333.80,
        explanation: 'Alleen in rekening te brengen na plaatsing van een definitieve kroon. Het prepareren voor het plaatsen van een kroon die het element geheel of gedeeltelijk bedekt (respectievelijk een totale omslijping en een omslijping van tenminste drie volledige vlakken) en het plaatsen van de kroon. Inclusief het beslijpen, het afdrukken en maken van een standaard beetregistratie, het bepalen van de kleur, het passen en plaatsen van zowel de noodvoorziening als de kroon en de benodigde tandvleescorrecties.',
        requiresTeethNumbers: true,
        canBeUsedAsPontic: true
    },
    {
        code: 'R34',
        description: 'Kroon op implantaat',
        points: 40,
        rate: 303.46,
        explanation: 'Alleen in rekening te brengen na plaatsing van een definitieve kroon. Tot deze prestatie behoort het zo nodig beslijpen, het afdrukken en maken van een standaard beetregistratie, het bepalen van de kleur en het plaatsen van de kroon en het eventueel vullen van het schroefgat.',
        requiresTeethNumbers: true,
        requiresImplant: true,
        canBeUsedAsPontic: true
    },
    {
        code: 'R29',
        description: 'Confectiekroon',
        points: 9,
        rate: 68.28,
        explanation: 'Bedoeld als definitief geplaatste confectiekroon.',
        requiresTeethNumbers: true
    },
    {
        code: 'R31',
        description: 'Opbouw plastisch materiaal',
        points: 10,
        rate: 75.86,
        explanation: 'Opbouw plastisch materiaal, inclusief etsen en/of onderlaag en afwerking. Het aanbrengen van vulmateriaal ten behoeve van een kroon vanaf de zitting van het prepareren tot het plaatsen van de kroon.',
        requiresTeethNumbers: true
    },
    {
        code: 'R32',
        description: 'Gegoten opbouw, indirecte methode',
        points: 10,
        rate: 75.86,
        explanation: 'Inclusief noodvoorziening.',
        requiresTeethNumbers: true
    },
    {
        code: 'R33',
        description: 'Gegoten opbouw, directe methode',
        points: 20,
        rate: 151.73,
        explanation: 'Inclusief noodvoorziening.',
        requiresTeethNumbers: true
    }
];
// B. Bridgework (Brugwerk)
exports.BRIDGEWORK = [
    {
        code: 'R40',
        description: 'Eerste brugtussendeel',
        points: 30,
        rate: 227.59,
        requiresTeethNumbers: true,
        isPontic: true
    },
    {
        code: 'R45',
        description: 'Toeslag bij een conventionele brug voor elk volgende brugtussendeel in hetzelfde tussendeel',
        points: 15,
        rate: 113.80,
        explanation: 'Per brugtussendeel. Toeslag bij prestatie R40 indien sprake is van meer dan één brugtussendeel (dummy) in hetzelfde tussendeel. Ook voor implantaatgedragen bruggen.',
        requiresTeethNumbers: true,
        validWithCodes: ['R40']
    },
    {
        code: 'R49',
        description: 'Toeslag voor brug op vijf- of meer pijlerelementen',
        points: 25,
        rate: 189.66,
        requiresTeethNumbers: true,
        minElements: 5
    },
    {
        code: 'R50',
        description: 'Metalen fixatiekap met afdruk',
        points: 5,
        rate: 37.93,
        explanation: 'Ongeacht het aantal kappen per brug.',
        requiresTeethNumbers: true
    },
    {
        code: 'R55',
        description: 'Gipsslot met extra afdruk',
        points: 5,
        rate: 37.93,
        explanation: 'Niet in combinatie met R50.',
        requiresTeethNumbers: true,
        incompatibleCodes: ['R50']
    },
    {
        code: 'R60',
        description: 'Plakbrug zonder preparatie',
        points: 20,
        rate: 151.73,
        explanation: 'Eén dummy met bevestiging aan één of twee elementen. Pontic met of zonder metalen retentierooster, aan pijlerelementen bevestigd door middel van composiet/etstechniek, inclusief etsen.',
        requiresTeethNumbers: true,
        maxElements: 2
    },
    {
        code: 'R61',
        description: 'Plakbrug met preparatie',
        points: 30,
        rate: 227.59,
        explanation: 'Eén dummy met bevestiging aan twee elementen. Pontic met of zonder metalen retentierooster, aan pijlerelementen bevestigd door middel van composiet/etstechniek, inclusief etsen.',
        requiresTeethNumbers: true,
        requiresElements: 2
    },
    {
        code: 'R65',
        description: 'Toeslag bij een plakbrug voor elk volgende brugtussendeel in hetzelfde tussendeel',
        points: 7,
        rate: 53.11,
        explanation: 'Per brugtussendeel. Toeslag bij prestatie R60 of R61 indien sprake is van meer dan één brugtussendeel (dummy) in hetzelfde tussendeel.',
        requiresTeethNumbers: true,
        validWithCodes: ['R60', 'R61']
    },
    {
        code: 'R66',
        description: 'Toeslag bij een plakbrug voor elke volgende bevestiging boven het aantal van twee',
        points: 4,
        rate: 30.35,
        explanation: 'Toeslag bij prestatie R60 of R61.',
        requiresTeethNumbers: true,
        validWithCodes: ['R60', 'R61']
    }
];
// C. Various Restorations (Restauraties diversen)
exports.VARIOUS_RESTORATIONS = [
    {
        code: 'R67',
        description: 'Plaatsen opbouw ten behoeve van implantaatkroon',
        points: 4.3,
        rate: 32.62,
        explanation: 'Bedoeld als opbouw t.b.v. kroon- en brugwerk. Kan worden gedeclareerd bij een losse opbouw of bij een opbouw die al in de kroon is voorverlijmd.',
        requiresTeethNumbers: true,
        requiresImplant: true
    },
    {
        code: 'R70',
        description: 'Toeslag voor kroon onder bestaand frame-anker',
        points: 11,
        rate: 83.45,
        explanation: 'Toeslag in rekening te brengen bovenop kroontarief.',
        requiresTeethNumbers: true
    },
    {
        code: 'R71',
        description: 'Vernieuwen porseleinen schildje, reparatie metalen/porseleinen kroon in de mond',
        points: 11,
        rate: 83.45,
        requiresTeethNumbers: true
    },
    {
        code: 'R74',
        description: 'Opnieuw vastzetten niet plastische restauraties',
        points: 4,
        rate: 30.35,
        explanation: 'Per kroon of pijlerelement in rekening te brengen.',
        requiresTeethNumbers: true
    },
    {
        code: 'R75',
        description: 'Opnieuw vastzetten plakbrug',
        points: 10,
        rate: 75.86,
        requiresTeethNumbers: true
    },
    {
        code: 'R76',
        description: 'Toeslag voor gegoten opbouw onder bestaande kroon',
        points: 5,
        rate: 37.93,
        requiresTeethNumbers: true
    },
    {
        code: 'R77',
        description: 'Moeizaam verwijderen van oud kroon- en brugwerk per (pijler)element',
        points: 5,
        rate: 37.93,
        requiresTeethNumbers: true
    },
    {
        code: 'R91',
        description: 'Wortelkap met stift',
        points: 25,
        rate: 189.66,
        explanation: 'Plaatsen van een kap op de natuurlijke wortels van tanden en kiezen waarover een frame- of overkappingskunstgebit geplaatst wordt.',
        requiresTeethNumbers: true
    },
    {
        code: 'R92',
        description: 'Passen restauratieve proefopstelling in de mond',
        points: 13.5,
        rate: 102.42,
        explanation: 'Het aanbrengen (mock-up) en weer verwijderen van een restauratieve proefopstelling in de mond voor het testen en laten zien van het beoogde eindresultaat. Deze prestatie kan alleen in rekening worden gebracht indien deze prestatie op verzoek van de patiënt wordt uitgevoerd. Per kaak in rekening te brengen.',
        requiresJawSide: true
    }
];
// Export all R-codes
exports.R_CODES = [
    ...exports.INLAYS_AND_CROWNS,
    ...exports.BRIDGEWORK,
    ...exports.VARIOUS_RESTORATIONS
];
