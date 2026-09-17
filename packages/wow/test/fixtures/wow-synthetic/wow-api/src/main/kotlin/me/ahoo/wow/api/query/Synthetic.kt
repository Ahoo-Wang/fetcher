// Not Wow source. A stand-in checkout holding one rule in each of the shapes
// Kotlin states a rule with, so `check-wow-conformance.mjs` is held to finding
// all of them. Two earlier drafts of that script reported success while seeing
// a third of the real rules.
package me.ahoo.wow.api.query

internal object Synthetic {
    fun plain(value: Int) {
        require(value > 0) { "Synthetic plain require." }
    }

    fun nestedParens(values: List<String>, other: List<String>) {
        require(values.isNotEmpty() && other.distinct().size == other.size) {
            "Synthetic require with parentheses in its condition."
        }
    }

    fun notNull(value: String?) {
        requireNotNull(value) { "Synthetic requireNotNull." }
    }

    fun checked(value: Int) {
        check(value > 0) { "Synthetic check." }
    }

    fun checkedNotNull(value: String?) {
        checkNotNull(value) { "Synthetic checkNotNull." }
    }

    fun errored(): Nothing = error("Synthetic error call.")

    fun thrown(): Nothing = throw IllegalArgumentException("Synthetic throw.")
}
