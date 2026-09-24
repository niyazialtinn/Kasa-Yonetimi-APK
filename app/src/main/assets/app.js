const STORAGE_KEY = "kasa-excel-v2";

const START_BANK = 20000;
const TARGET_LOW = 150000;
const TARGET_HIGH = 200000;

let data;

try {
    data =
        JSON.parse(localStorage.getItem(STORAGE_KEY)) ||
        {
            start: START_BANK,
            entries: []
        };
} catch (e) {
    data = {
        start: START_BANK,
        entries: []
    };
}

let selectedResult = "KAZANDI";

const $ = id =>
    document.getElementById(id);


function money(value) {

    return new Intl.NumberFormat(
        "tr-TR",
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    ).format(value) + " TL";
}


function currentBank() {

    if (data.entries.length === 0) {
        return data.start;
    }

    return data.entries[
        data.entries.length - 1
    ].endBank;
}


function saveData() {

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(data)
    );
}


function calculatePreview() {

    const startBank =
        currentBank();

    const risk =
        parseFloat(
            $("risk").value
        ) || 0;

    const odds =
        parseFloat(
            $("odds").value
        );

    const stake =
        startBank * risk / 100;

    $("stake").textContent =
        money(stake);


    if (
        !Number.isFinite(odds) ||
        odds <= 1
    ) {

        $("preview").textContent =
            "Oranı girince tahmini gün sonu burada görünecek.";

        return;
    }


    let profitLoss;

    if (
        selectedResult ===
        "KAZANDI"
    ) {

        profitLoss =
            stake * (odds - 1);

    } else {

        profitLoss =
            -stake;
    }


    const endBank =
        startBank + profitLoss;


    if (
        selectedResult ===
        "KAZANDI"
    ) {

        $("preview").textContent =
            "Tahmini net kâr: " +
            money(profitLoss) +
            " • Gün sonu kasa: " +
            money(endBank);

    } else {

        $("preview").textContent =
            "Tahmini fire: " +
            money(stake) +
            " • Gün sonu kasa: " +
            money(endBank);
    }
}


function render() {

    const bank =
        currentBank();

    const totalProfitLoss =
        bank - data.start;


    const winningEntries =
        data.entries.filter(
            item =>
                item.result ===
                "KAZANDI"
        );


    const fireEntries =
        data.entries.filter(
            item =>
                item.result ===
                "FİRE"
        );


    const totalFire =
        fireEntries.reduce(
            (total, item) =>
                total + item.stake,
            0
        );


    $("currentBank").textContent =
        money(bank);


    if (
        totalProfitLoss >= 0
    ) {

        $("totalPL").textContent =
            "Toplam Kâr/Zarar: +" +
            money(
                totalProfitLoss
            );

    } else {

        $("totalPL").textContent =
            "Toplam Kâr/Zarar: -" +
            money(
                Math.abs(
                    totalProfitLoss
                )
            );
    }


    $("winDays").textContent =
        winningEntries.length;


    $("lossDays").textContent =
        fireEntries.length;


    $("totalFire").textContent =
        money(totalFire);


    $("toLow").textContent =
        money(
            Math.max(
                0,
                TARGET_LOW - bank
            )
        );


    $("toHigh").textContent =
        money(
            Math.max(
                0,
                TARGET_HIGH - bank
            )
        );


    const history =
        $("history");


    history.innerHTML =
        data.entries
        .map(item => {

            const resultClass =
                item.result ===
                "KAZANDI"
                    ? "win"
                    : "fire";


            const profitClass =
                item.profitLoss >= 0
                    ? "pos"
                    : "neg";


            const profitText =
                item.profitLoss >= 0
                    ? "+" +
                      money(
                          item.profitLoss
                      )
                    : "-" +
                      money(
                          Math.abs(
                              item.profitLoss
                          )
                      );


            return `
                <tr>

                    <td>
                        ${item.day}
                    </td>

                    <td>
                        ${money(
                            item.startBank
                        )}
                    </td>

                    <td>
                        %${Number(
                            item.risk
                        ).toFixed(2)}
                    </td>

                    <td>
                        ${money(
                            item.stake
                        )}
                    </td>

                    <td>
                        ${Number(
                            item.odds
                        ).toFixed(2)}
                    </td>

                    <td>

                        <span
                            class="tag ${resultClass}">

                            ${item.result}

                        </span>

                    </td>

                    <td
                        class="${profitClass}">

                        ${profitText}

                    </td>

                    <td>

                        <b>
                            ${money(
                                item.endBank
                            )}
                        </b>

                    </td>

                </tr>
            `;

        })
        .join("");


    $("empty").style.display =
        data.entries.length
            ? "none"
            : "block";


    calculatePreview();
}


$("risk").addEventListener(
    "input",
    calculatePreview
);


$("odds").addEventListener(
    "input",
    calculatePreview
);


document
.querySelectorAll(".choice")
.forEach(button => {

    button.addEventListener(
        "click",
        () => {

            selectedResult =
                button.dataset.result;


            document
            .querySelectorAll(
                ".choice"
            )
            .forEach(item => {

                item.classList.remove(
                    "active"
                );

            });


            button.classList.add(
                "active"
            );


            calculatePreview();
        }
    );
});


$("save").addEventListener(
    "click",
    () => {

        const risk =
            parseFloat(
                $("risk").value
            );


        const odds =
            parseFloat(
                $("odds").value
            );


        if (
            !Number.isFinite(risk) ||
            risk <= 0 ||
            risk > 100
        ) {

            alert(
                "Risk % 0 ile 100 arasında olmalıdır."
            );

            return;
        }


        if (
            !Number.isFinite(odds) ||
            odds <= 1
        ) {

            alert(
                "Geçerli bir oran gir."
            );

            return;
        }


        const startBank =
            currentBank();


        const stake =
            startBank *
            risk /
            100;


        let profitLoss;


        if (
            selectedResult ===
            "KAZANDI"
        ) {

            profitLoss =
                stake *
                (odds - 1);

        } else {

            profitLoss =
                -stake;
        }


        const endBank =
            startBank +
            profitLoss;


        data.entries.push({

            day:
                data.entries.length +
                1,

            startBank:
                startBank,

            risk:
                risk,

            stake:
                stake,

            odds:
                odds,

            result:
                selectedResult,

            profitLoss:
                profitLoss,

            endBank:
                endBank
        });


        saveData();


        $("odds").value =
            "";


        render();
    }
);


$("reset").addEventListener(
    "click",
    () => {

        const approved =
            confirm(
                "Tüm günlük kayıtlar silinsin ve kasa 20.000 TL'ye dönsün mü?"
            );


        if (!approved) {
            return;
        }


        data = {

            start:
                START_BANK,

            entries:
                []
        };


        saveData();

        render();
    }
);


render();
