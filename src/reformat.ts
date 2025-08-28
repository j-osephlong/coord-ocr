const LOG_TAG = "[reformat.ts]" as const;

export interface FormatConfig {
    /**Comma deliminated list of columns names */
    format: string,
    /**Description column name */
    descriptionColumnName: string,
    /**Id column name */
    idColumnName: string,
    /**Comma deliminated list of number column names */
    numberColumnNames: string,
    /**Text to append to end of description column */
    appendToDescription?: string,
    /**Return raw text of OCR, don't process at all */
    raw: boolean,
}

// this regex considers whitespace, |, (, ), and {, } as whitespace, since the extra characters often show up in tesseract's results from column lines 
const whitespaceChars = /[\s|\||\(|\)|\{|\}]+/g

function correctNumber(text: string) {
    return text.toLowerCase()
        // remove spaces
        .replace(" ", "")
        // commas -> decimals
        .replace(",", ".")
        // common letter/punctuation mixups
        .replace("|", "1")
        .replace("i", "1")
        .replace("!", "1")
        .replace("g", "6")
        .replace("s", "5")
        .replace("o", "0")
        .replace("b", "8")
        .replace("z", "2")
}

export function reformatText(text: string, formatConfig: FormatConfig) {
    if (formatConfig.raw) {
        return text
    }
    const formatStringSplit = formatConfig.format.split(",")
    const numCols = formatStringSplit.length
    const descriptionIndex = formatStringSplit.indexOf(formatConfig.descriptionColumnName)
    const lines = text.split("\n")
    const linesSplit: string[][] = []
    // build list of lines split into columns
    // based off of the user supplied format string, we know how many columns there should be (n)
    // we try to find the best n-1 splits for the line by finding the n-1 longest runs of 'whitespace' in the line
    for (const line of lines) {
        const whitespaceRuns: {pos: number, len: number}[] = []
        let match;
        // use the regex to find all white space matches
        while ((match = whitespaceChars.exec(line)) !== null) {
            whitespaceRuns.push({ pos: match.index, len: match[0].length });
        }
        const biggest = whitespaceRuns
            // .filter(run => run.len > 1) // filter out matches of length 1
            .sort((a, b) => b.len - a.len || a.pos - b.pos) // sort by length
            .slice(0, numCols - 1) // take n-1
            .sort((a, b) => a.pos - b.pos); // sort back to earliest in line to latest
        // build list of columns
        const lineSplit = []
        let lastIdx = 0;
        for (const run of biggest) {
            lineSplit.push(line.slice(lastIdx, run.pos).trim());
            lastIdx = run.pos + run.len
        }
        lineSplit.push(line.slice(lastIdx).trim()) // add last column
        linesSplit.push(lineSplit) // add line to list of lines
    }
    console.debug(LOG_TAG, linesSplit);
    // filter out lines of incorrect length
    const validLinesSplit = linesSplit.filter(l => l.length == numCols)
    // add file name to description if enabled
    if (!!descriptionIndex && descriptionIndex != -1 && !!formatConfig.appendToDescription) {
        validLinesSplit.map(l => l[descriptionIndex] += ` /${formatConfig.appendToDescription}`)
    }
    // correct common number errors
    const numColIndexes = formatConfig.numberColumnNames.split(",").map(col => formatStringSplit.indexOf(col)).filter(index => index != -1)
    for (const line of validLinesSplit) {
        for (const index of numColIndexes) {
            line[index] = correctNumber(line[index])
        }
    }
    // join everything back to one big string
    const validJoined = validLinesSplit.map(l => l.join(","))
    if (validJoined.length < linesSplit.length / 2)
        return text
    return validJoined.join("\n")
}