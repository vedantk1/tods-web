let moment = require("moment");

module.exports = {
  QueryBuilder: function (params) {
    console.log("QueryBuilder");
    var builder = "";
    let from_date = null,
      to_date = null;
    console.log(params, "params");
    switch (params["operator"]) {
      // Example :
      // ILIKE '_her%'
      // Begin with any single character(_)
      // And is followed by the literal string her.
      // And is ended with any number of characters.
      case "contains":
        builder = " ILIKE '%" + params["query_1"] + "%'";
        break;
      case "starts_with":
        builder = " ILIKE '" + params["query_1"] + "%'";
        break;
      case "ends_with":
        builder = " ILIKE '%" + params["query_1"] + "'";
        break;
      case "equal_to":
        builder = " ='" + params["query_1"] + "'";
        break;
      case "not_equal_to":
        builder = " !='" + params["query_1"] + "'";
        break;
      case "less_than":
        builder = " < " + params["query_1"];
        break;
      case "greater_than":
        builder = " >" + params["query_1"];
        break;
      case "between":
        (from_date = moment(
          moment(moment(params["query_1"]).startOf("date"))
        ).format("YYYY-MM-DD HH:mm:ss.SSS ZZ")),
          (to_date = moment(
            moment(moment(params["query_2"]).endOf("date"))
          ).format("YYYY-MM-DD HH:mm:ss.SSS ZZ"));
        console.log(from_date, "between from_date", to_date, "between to_date");
        builder = " between " + `'${from_date}'` + " AND  " + `'${to_date}'`;
        break;
      case "not_between":
        (from_date = moment(
          moment(moment(params["query_1"]).startOf("date"))
        ).format("YYYY-MM-DD HH:mm:ss.SSS ZZ"));
        (to_date = moment(
          moment(moment(params["query_2"]).endOf("date"))
        ).format("YYYY-MM-DD HH:mm:ss.SSS ZZ"));
        console.log(from_date, "between from_date", to_date, "between to_date");
        builder =
          " not between " + `'${from_date}'` + " AND  " + `'${to_date}'`;
        break;
      case "in_the_peroid":
        if (params["query_1"]) {
          (from_date = moment().format("YYYY-MM-DD HH:mm:ss.SSS ZZ")),
            (to_date = moment().format("YYYY-MM-DD HH:mm:ss.SSS ZZ"));
          console.log(from_date, "from_date", to_date, "to_date");
          switch (params["query_1"]) {
            case "yesterday":
              from_date = moment(
                moment(moment().startOf("date")).subtract(1, "day")
              ).format("YYYY-MM-DD HH:mm:ss.SSS ZZ");
              to_date = moment(
                moment(moment().endOf("date")).subtract(1, "day")
              ).format("YYYY-MM-DD HH:mm:ss.SSS ZZ");
              console.log(
                from_date,
                "yesterday from_date",
                to_date,
                "yesterday to_date"
              );
              builder =
                " between " + `'${from_date}'` + " AND  " + `'${to_date}'`;
              break;
            case "today":
              from_date = moment(moment(moment().startOf("date"))).format(
                "YYYY-MM-DD HH:mm:ss.SSS ZZ"
              );
              to_date = moment(moment(moment().endOf("date"))).format(
                "YYYY-MM-DD HH:mm:ss.SSS ZZ"
              );
              console.log(
                from_date,
                "today from_date",
                to_date,
                "today to_date"
              );
              builder =
                " between " + `'${from_date}'` + " AND  " + `'${to_date}'`;
              break;
            case "tomorrow":
              from_date = moment(
                moment(moment().startOf("date")).add(1, "day")
              ).format("YYYY-MM-DD HH:mm:ss.SSS ZZ");
              to_date = moment(
                moment(moment().endOf("date")).add(1, "day")
              ).format("YYYY-MM-DD HH:mm:ss.SSS ZZ");
              console.log(
                from_date,
                "tomorrow from_date",
                to_date,
                "tomorrow to_date"
              );
              builder =
                " between " + `'${from_date}'` + " AND  " + `'${to_date}'`;
              break;
            case "last_week":
              from_date = moment(
                moment(moment().startOf("week")).subtract(1, "week")
              ).format("YYYY-MM-DD HH:mm:ss.SSS ZZ");
              to_date = moment(
                moment(moment().endOf("week")).subtract(1, "week")
              ).format("YYYY-MM-DD HH:mm:ss.SSS ZZ");
              console.log(
                from_date,
                "last_week from_date",
                to_date,
                "last_week to_date"
              );
              builder =
                " between " + `'${from_date}'` + " AND  " + `'${to_date}'`;
              break;
            case "this_week":
              from_date = moment(moment(moment().startOf("week"))).format(
                "YYYY-MM-DD HH:mm:ss.SSS ZZ"
              );
              to_date = moment(moment(moment().endOf("week"))).format(
                "YYYY-MM-DD HH:mm:ss.SSS ZZ"
              );
              console.log(
                from_date,
                "this_week from_date",
                to_date,
                "this_week to_date"
              );
              builder =
                " between " + `'${from_date}'` + " AND  " + `'${to_date}'`;
              break;
            //
            case "last_month":
              from_date = moment(
                moment(moment().startOf("month")).subtract(1, "month")
              ).format("YYYY-MM-DD HH:mm:ss.SSS ZZ");
              to_date = moment(
                moment(moment().endOf("month")).subtract(1, "month")
              ).format("YYYY-MM-DD HH:mm:ss.SSS ZZ");
              console.log(
                from_date,
                "last_month from_date",
                to_date,
                "last_month to_date"
              );
              builder =
                " between " + `'${from_date}'` + " AND  " + `'${to_date}'`;
              break;
            case "this_month":
              from_date = moment(moment(moment().startOf("month"))).format(
                "YYYY-MM-DD HH:mm:ss.SSS ZZ"
              );
              to_date = moment(moment(moment().endOf("month"))).format(
                "YYYY-MM-DD HH:mm:ss.SSS ZZ"
              );
              console.log(
                from_date,
                "this_month from_date",
                to_date,
                "this_month to_date"
              );
              builder =
                " between " + `'${from_date}'` + " AND  " + `'${to_date}'`;
              break;
            case "next_month":
              from_date = moment(
                moment(moment().startOf("month")).add(1, "month")
              ).format("YYYY-MM-DD HH:mm:ss.SSS ZZ");
              to_date = moment(
                moment(moment().endOf("month")).add(1, "month")
              ).format("YYYY-MM-DD HH:mm:ss.SSS ZZ");
              console.log(
                from_date,
                "next_month from_date",
                to_date,
                "next_month to_date"
              );
              builder =
                " between " + `'${from_date}'` + " AND  " + `'${to_date}'`;
              break;
            case "last_year":
              from_date = moment(
                moment(moment().startOf("year")).subtract(1, "year")
              ).format("YYYY-MM-DD HH:mm:ss.SSS ZZ");
              to_date = moment(
                moment(moment().endOf("year")).subtract(1, "year")
              ).format("YYYY-MM-DD HH:mm:ss.SSS ZZ");
              console.log(
                from_date,
                "last_year from_date",
                to_date,
                "last_year to_date"
              );
              builder =
                " between " + `'${from_date}'` + " AND  " + `'${to_date}'`;
              break;
            case "this_year":
              from_date = moment(moment(moment().startOf("year"))).format(
                "YYYY-MM-DD HH:mm:ss.SSS ZZ"
              );
              to_date = moment(moment(moment().endOf("year"))).format(
                "YYYY-MM-DD HH:mm:ss.SSS ZZ"
              );
              console.log(
                from_date,
                "this_year from_date",
                to_date,
                "this_year to_date"
              );
              builder =
                " between " + `'${from_date}'` + " AND  " + `'${to_date}'`;
              break;
            case "next_year":
              from_date = moment(
                moment(moment().startOf("year")).add(1, "year")
              ).format("YYYY-MM-DD HH:mm:ss.SSS ZZ");
              to_date = moment(
                moment(moment().endOf("year")).add(1, "year")
              ).format("YYYY-MM-DD HH:mm:ss.SSS ZZ");
              console.log(
                from_date,
                "next_year from_date",
                to_date,
                "next_year to_date"
              );
              builder =
                " between " + `'${from_date}'` + " AND  " + `'${to_date}'`;
              break;
            default:
              console.log(
                from_date,
                "default from_date",
                to_date,
                "default to_date"
              );
              builder =
                " between " + `'${from_date}'` + " AND  " + `'${to_date}'`;
              break;
          }
        }
        break;
    }
    return builder;
  },
};
