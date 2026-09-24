const STORAGE_KEY = "kasa-excel-v2";
const DEFAULT_START_BANK = 20000;

const TARGET_LOW = 150000;
const TARGET_HIGH = 200000;

let data;

try {

    data =
        JSON.parse(
            localStorage.getItem(
                STORAGE_KEY
            )
        ) || {
            start: DEFAULT_START_BANK,
            entries: []
        };

} catch (e) {

    data = {
        start: DEFAULT_START_BANK,
        entries: []
    };
}


/*
 Eski sürümden gelen verilerde
 başlangıç kasası yoksa 20.000 TL
 varsayılan olarak kullanılır.
*/

if (
    !Number.isFinite(
        Number(data.start)
    ) ||
    Number(data.start) <= 0
) {

    data.start =
        DEFAULT_START_BANK;
}


let selectedResult =
    "KAZANDI";


const $ = id =>
    document.getElementById(id);


/* =========================================
   PARA FORMATLAMA
   ========================================= */

function money(value) {

    return new Intl.NumberFormat(
        "tr-TR",
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    ).format(
        Number(value) || 0
    ) + " TL";
}


/* =========================================
   VERİYİ KAYDET
   ========================================= */

function saveData() {

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(data)
    );
}


/* =========================================
   GÜNCEL KASA
   ========================================= */

function currentBank() {

    if (
        data.entries.length === 0
    ) {

        return Number(
            data.start
        );
    }


    return Number(
        data.entries[
            data.entries.length - 1
        ].endBank
    );
}


/* =========================================
   TÜM KASA ZİNCİRİNİ
   YENİDEN HESAPLA
   ========================================= */

function recalculateAll() {

    let runningBank =
        Number(data.start);


    data.entries.forEach(
        (item, index) => {

            const risk =
                Number(item.risk);

            const odds =
                Number(item.odds);


            const stake =
                runningBank *
                risk /
                100;


            let profitLoss;


            if (
                item.result ===
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
                runningBank +
                profitLoss;


            item.day =
                index + 1;


            item.startBank =
                runningBank;


            item.stake =
                stake;


            item.profitLoss =
                profitLoss;


            item.endBank =
                endBank;


            runningBank =
                endBank;
        }
    );


    saveData();
}


/* =========================================
   BAŞLANGIÇ KASASI ALANI
   ========================================= */

function showStartBank() {

    $("startBankInput").value =
        Number(data.start);
}


/* =========================================
   BAŞLANGIÇ KASASINI GÜNCELLE
   ========================================= */

$("updateStartBank")
.addEventListener(
    "click",
    () => {

        const newStartBank =
            parseFloat(
                $("startBankInput").value
            );


        if (
            !Number.isFinite(
                newStartBank
            ) ||
            newStartBank <= 0
        ) {

            alert(
                "Geçerli bir başlangıç kasası gir."
            );

            showStartBank();

            return;
        }


        /*
         Aynı tutarsa işlem yapmaya
         gerek yok.
        */

        if (
            newStartBank ===
            Number(data.start)
        ) {

            alert(
                "Başlangıç kasası zaten bu tutarda."
            );

            return;
        }


        let approved;


        if (
            data.entries.length > 0
        ) {

            approved =
                confirm(
                    "Başlangıç kasasını " +
                    money(newStartBank) +
                    " olarak değiştirmek istiyor musun?\n\n" +
                    "Mevcut günlük kayıtlar silinmeyecek. " +
                    "Tüm kasa hesapları yeni başlangıç kasasına göre yeniden hesaplanacak."
                );

        } else {

            approved =
                confirm(
                    "Başlangıç kasası " +
                    money(newStartBank) +
                    " olarak ayarlansın mı?"
                );
        }


        if (!approved) {

            showStartBank();

            return;
        }


        data.start =
            newStartBank;


        /*
         Bütün mevcut günleri
         yeni başlangıç kasasına
         göre yeniden hesapla.
        */

        recalculateAll();


        render();


        alert(
            "Başlangıç kasası " +
            money(newStartBank) +
            " olarak güncellendi."
        );
    }
);


/* =========================================
   YENİ GÜN ÖN İZLEME
   ========================================= */

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
        startBank *
        risk /
        100;


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
            stake *
            (odds - 1);

    } else {

        profitLoss =
            -stake;
    }


    const endBank =
        startBank +
        profitLoss;


    if (
        selectedResult ===
        "KAZANDI"
    ) {

        $("preview").textContent =
            "Tahmini net kâr: " +
            money(profitLoss) +
            " • Gün sonu: " +
            money(endBank);

    } else {

        $("preview").textContent =
            "Tahmini fire: " +
            money(stake) +
            " • Gün sonu: " +
            money(endBank);
    }
}


/* =========================================
   ANA EKRANI YENİLE
   ========================================= */

function render() {

    const bank =
        currentBank();


    const totalProfitLoss =
        bank -
        Number(data.start);


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
                total +
                Number(item.stake),
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
                TARGET_LOW -
                bank
            )
        );


    $("toHigh").textContent =
        money(
            Math.max(
                0,
                TARGET_HIGH -
                bank
            )
        );


    /*
     Başlangıç kasası alanında
     her zaman kayıtlı tutarı göster.
    */

    showStartBank();


    const history =
        $("history");


    history.innerHTML =
        data.entries
        .map(
            (item, index) => {

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

                        <input
                            class="table-input risk-edit"
                            type="number"
                            min="0.01"
                            max="100"
                            step="0.01"
                            value="${item.risk}"
                            data-index="${index}">

                    </td>


                    <td>
                        ${money(
                            item.stake
                        )}
                    </td>


                    <td>

                        <input
                            class="table-input odds-edit"
                            type="number"
                            min="1.01"
                            step="0.01"
                            value="${item.odds}"
                            data-index="${index}">

                    </td>


                    <td>

                        <button
                            type="button"
                            class="table-result ${resultClass}"
                            data-index="${index}">

                            ${item.result}

                        </button>

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


                    <td>

                        <button
                            type="button"
                            class="delete-row"
                            data-index="${index}"
                            title="Kaydı Sil">

                            🗑️

                        </button>

                    </td>

                </tr>

                `;
            }
        )
        .join("");


    $("empty").style.display =
        data.entries.length
            ? "none"
            : "block";


    addTableEvents();

    calculatePreview();
}


/* =========================================
   TABLO İÇİ İŞLEMLER
   ========================================= */

function addTableEvents() {


    /* RİSK DEĞİŞTİR */

    document
    .querySelectorAll(
        ".risk-edit"
    )
    .forEach(input => {

        input.addEventListener(
            "change",
            function () {

                const index =
                    Number(
                        this.dataset.index
                    );


                const value =
                    parseFloat(
                        this.value
                    );


                if (
                    !Number.isFinite(value) ||
                    value <= 0 ||
                    value > 100
                ) {

                    alert(
                        "Risk % 0 ile 100 arasında olmalıdır."
                    );

                    render();

                    return;
                }


                data.entries[
                    index
                ].risk =
                    value;


                recalculateAll();

                render();
            }
        );
    });


    /* ORAN DEĞİŞTİR */

    document
    .querySelectorAll(
        ".odds-edit"
    )
    .forEach(input => {

        input.addEventListener(
            "change",
            function () {

                const index =
                    Number(
                        this.dataset.index
                    );


                const value =
                    parseFloat(
                        this.value
                    );


                if (
                    !Number.isFinite(value) ||
                    value <= 1
                ) {

                    alert(
                        "Geçerli bir oran gir."
                    );

                    render();

                    return;
                }


                data.entries[
                    index
                ].odds =
                    value;


                recalculateAll();

                render();
            }
        );
    });


    /* KAZANDI / FİRE DEĞİŞTİR */

    document
    .querySelectorAll(
        ".table-result"
    )
    .forEach(button => {

        button.addEventListener(
            "click",
            function () {

                const index =
                    Number(
                        this.dataset.index
                    );


                if (
                    data.entries[
                        index
                    ].result ===
                    "KAZANDI"
                ) {

                    data.entries[
                        index
                    ].result =
                        "FİRE";

                } else {

                    data.entries[
                        index
                    ].result =
                        "KAZANDI";
                }


                recalculateAll();

                render();
            }
        );
    });


    /* TEK KAYIT SİL */

    document
    .querySelectorAll(
        ".delete-row"
    )
    .forEach(button => {

        button.addEventListener(
            "click",
            function () {

                const index =
                    Number(
                        this.dataset.index
                    );


                const day =
                    data.entries[
                        index
                    ].day;


                const approved =
                    confirm(
                        day +
                        ". gün kaydı silinsin mi?"
                    );


                if (!approved) {
                    return;
                }


                data.entries.splice(
                    index,
                    1
                );


                recalculateAll();

                render();
            }
        );
    });
}


/* =========================================
   YENİ GÜN ALANLARI
   ========================================= */

$("risk").addEventListener(
    "input",
    calculatePreview
);


$("odds").addEventListener(
    "input",
    calculatePreview
);


/* =========================================
   KAZANDI / FİRE SEÇİMİ
   ========================================= */

document
.querySelectorAll(
    ".choice"
)
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


/* =========================================
   YENİ GÜN KAYDET
   ========================================= */

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


/* =========================================
   TÜM KAYITLARI SİL
   ========================================= */

$("reset").addEventListener(
    "click",
    () => {

        const approved =
            confirm(
                "Tüm günlük kayıtlar silinsin mi?\n\nBaşlangıç kasası değişmeden kalacaktır."
            );


        if (!approved) {
            return;
        }


        /*
         ÖNEMLİ:
         Artık başlangıç kasasını
         20.000 TL'ye döndürmüyoruz.
        */

        data.entries =
            [];


        saveData();

        render();
    }
);


/* =========================================
   UYGULAMA AÇILIŞI
   ========================================= */

recalculateAll();

render();
