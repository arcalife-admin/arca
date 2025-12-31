export const xCodes = [
    {
        code: 'X10',
        description: 'Maken en beoordelen kleine röntgenfoto',
        points: 2.8,
        rate: 21.24,
        requirements: {
            perImage: true,
            notes: ['Per opname.']
        }
    },
    {
        code: 'X11',
        description: 'Beoordelen kleine röntgenfoto',
        points: 2.1,
        rate: 15.93,
        requirements: {
            notes: ['Kan niet door dezelfde mondzorgaanbieder (praktijk) als X10 in rekening worden gebracht.']
        }
    },
    {
        code: 'X21',
        description: 'Maken en beoordelen kaakoverzichtsfoto',
        points: 12,
        rate: 91.04,
        requirements: {
            notes: ['Niet voor implantologie in de edentate kaak (zie X22).']
        }
    },
    {
        code: 'X22',
        description: 'Maken en beoordelen kaakoverzichtsfoto t.b.v. implantologie in de tandeloze kaak',
        points: 12,
        rate: 91.04
    },
    {
        code: 'X23',
        description: 'Beoordelen kaakoverzichtsfoto',
        points: 4.4,
        rate: 33.38,
        requirements: {
            notes: [
                'Beoordeling van overzichtsfoto gemaakt middels X21 of X22.',
                'Kan niet door dezelfde mondzorgaanbieder (praktijk) als X21 en X22 in rekening worden gebracht.'
            ]
        }
    },
    {
        code: 'X24',
        description: 'Maken en beoordelen schedelfoto',
        points: 5.4,
        rate: 40.97
    },
    {
        code: 'X34',
        description: 'Beoordelen schedelfoto',
        points: 4,
        rate: 30.35,
        requirements: {
            notes: ['Kan niet door dezelfde mondzorgaanbieder (praktijk) als X24 in rekening worden gebracht.']
        }
    },
    {
        code: 'X25',
        description: 'Maken en beoordelen meerdimensionale kaakfoto',
        points: 34,
        rate: 257.94,
        requirements: {
            notes: [
                'Het maken en beoordelen van een meerdimensionale kaakfoto (bijvoorbeeld CT-scan).',
                'Alleen uitvoeren indien dit een meerwaarde heeft t.o.v. conventionele röntgendiagnostiek.'
            ]
        }
    },
    {
        code: 'X26',
        description: 'Beoordelen meerdimensionale kaakfoto',
        points: 10,
        rate: 75.86,
        requirements: {
            notes: [
                'Beoordelen van de meerdimensionale kaakfoto en bespreken met de patiënt.',
                'Kan niet door dezelfde mondzorgaanbieder (praktijk) als X25 in rekening worden gebracht.'
            ]
        }
    }
];
